import cds from '@sap/cds'

const LOG = cds.log('po-service')

// Prints data compactly in the log, e.g. { supplier: 'Acme', items: [2 items] }
const show = data => JSON.stringify(data, (k, v) => Array.isArray(v) && k ? `[${v.length} items]` : v)

// Same file name as po-service.cds -> CAP connects them automatically
export default class POService extends cds.ApplicationService {

  // init() runs ONCE when the service starts - register your handlers here
  init() {
    const { PurchaseOrders, PurchaseOrderItems } = this.entities
    LOG.info('init() - registering handlers for', this.name)

    // ==================================================================
    // Every request goes through 3 phases:
    //   before -> validate / enrich input  (req.data)
    //   on     -> do the actual work       (default: CAP reads/writes the DB)
    //   after  -> post-process the result  (e.g. add or hide values)
    //
    // Note: all "before" handlers of one request start in registration
    // order but run in PARALLEL - don't rely on one finishing before the next.
    // ==================================================================

    // ==================================================================
    // DRAFT events - what the Fiori buttons trigger
    //   Create  -> NEW      (empty draft)
    //   Edit    -> EDIT     (copy active PO into a draft)
    //   typing  -> PATCH    = UPDATE on the draft, on every field change
    //   Save    -> SAVE     (draft becomes active -> fires CREATE or UPDATE below)
    //   Discard -> DISCARD  (draft thrown away)
    // ==================================================================
    this.before('NEW', PurchaseOrders.drafts, req => {
      LOG.info('[before NEW] user clicked Create - new draft with defaults')
      req.data.orderDate ??= new Date().toISOString().slice(0, 10) // default: today
    })

    this.before('EDIT', PurchaseOrders, req => {
      LOG.info('[before EDIT] user clicked Edit - copying PO into a draft')
    })

    this.before('UPDATE', PurchaseOrders.drafts, req => {
      LOG.info('[before PATCH] user changed a field in the draft:', show(req.data))
    })

    this.before('SAVE', PurchaseOrders.drafts, req => {
      LOG.info('[before SAVE] user clicked Save - activating the draft')
    })

    this.after('SAVE', PurchaseOrders.drafts, async (_, req) => {
      const po = await SELECT.one.from(PurchaseOrders, req.data.ID)
      LOG.info('[after SAVE] PO', po.poNumber, 'is now active')
      // Messages are shown in the Fiori UI as well
      req.info(`Purchase order ${po.poNumber} saved. Total: ${po.totalAmount} ${po.currency}`)
    })

    this.before('DISCARD', PurchaseOrders.drafts, req => {
      LOG.info('[before DISCARD] user clicked Discard - draft will be deleted')
    })

    // ---------------------------- READ ---------------------------------
    this.before('READ', PurchaseOrders, req => {
      LOG.info('[before READ]', req.target.name, '- filter:', show(req.query.SELECT.where ?? 'all rows'))
    })

    // "on" replaces the default; call next() to still let CAP do the DB read
    this.on('READ', PurchaseOrders, async (req, next) => {
      const start = Date.now()
      const result = await next()
      LOG.info('[on READ] database read took', Date.now() - start, 'ms')
      return result
    })

    this.after('READ', PurchaseOrders, (results, req) => {
      const rows = Array.isArray(results) ? results : [results]
      LOG.info('[after READ] returning', rows.length, 'PO(s):', rows.map(po => po?.poNumber).join(', '))
    })

    // ---------------------------- CREATE -------------------------------
    // Runs when a new PO is saved (draft activated) or created via the API
    this.before('CREATE', PurchaseOrders, async req => {
      LOG.info('[before CREATE] incoming data:', show(req.data))

      // Give every new PO the next number, SAP-style: 4500000001, 4500000002, ...
      const { max } = await SELECT.one`max(poNumber) as max`.from(PurchaseOrders)
      req.data.poNumber = String(Number(max ?? 4500000000) + 1)
      req.data.status = 'New'
      LOG.info('[before CREATE] assigned PO number', req.data.poNumber)

      calculateTotals(req)
    })

    this.after('CREATE', PurchaseOrders, (_, req) => {
      LOG.info('[after CREATE] saved PO', req.data.poNumber, 'with total', req.data.totalAmount)
    })

    // ---------------------------- UPDATE -------------------------------
    this.before('UPDATE', PurchaseOrders, req => {
      LOG.info('[before UPDATE] PO', req.data.poNumber, '- changed data:', show(req.data))
      calculateTotals(req)
    })

    this.after('UPDATE', PurchaseOrders, (_, req) => {
      LOG.info('[after UPDATE] PO', req.data.poNumber, 'updated')
    })

    // ---------------------------- DELETE -------------------------------
    this.before('DELETE', PurchaseOrders, async req => {
      const po = await SELECT.one.from(req.subject).columns('poNumber', 'status')
      LOG.info('[before DELETE] about to delete PO', po?.poNumber, '- status:', po?.status)
      // Business rule example: you can stop a request with req.reject()
      if (po?.status === 'Approved') req.reject(400, `PO ${po.poNumber} is approved and cannot be deleted`)
    })

    this.after('DELETE', PurchaseOrders, (_, req) => {
      LOG.info('[after DELETE] PO deleted')
    })

    // ------------------------ Items (child entity) ---------------------
    this.after('READ', PurchaseOrderItems, results => {
      const rows = Array.isArray(results) ? results : [results]
      LOG.info('[after READ] returning', rows.length, 'item(s)')
    })

    return super.init()
  }
}

// Calculate item amounts and the PO total (used by CREATE and UPDATE)
function calculateTotals(req) {
  const po = req.data
  if (!po.items) return

  let total = 0
  po.items.forEach((item, i) => {
    item.itemNo ??= (i + 1) * 10
    item.netAmount = Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0)
    total += item.netAmount
  })
  po.totalAmount = total
  LOG.info(`[before ${req.event}] calculated total:`, total, po.currency ?? '')
}
