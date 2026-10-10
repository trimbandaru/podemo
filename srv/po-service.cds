using podemo from '../db/schema';

// Exposed as OData V4 at /odata/v4/po
service POService {

  // draft.enabled -> Fiori gets Create / Edit / Save / Discard for free
  @odata.draft.enabled
  entity PurchaseOrders     as projection on podemo.PurchaseOrders;

  entity PurchaseOrderItems as projection on podemo.PurchaseOrderItems;
}

// Fields the user should not type - filled by the handler in po-service.js
annotate POService.PurchaseOrders with {
  poNumber    @readonly;
  status      @readonly;
  totalAmount @readonly;
}

annotate POService.PurchaseOrderItems with {
  netAmount @readonly;
}
