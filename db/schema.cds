namespace podemo;

using { cuid, managed } from '@sap/cds/common';

// Purchase order header
// cuid    -> adds a UUID key field "ID"
// managed -> adds createdAt, createdBy, modifiedAt, modifiedBy
entity PurchaseOrders : cuid, managed {
  poNumber    : String(10)    @title: 'PO Number';
  supplier    : String(100)   @title: 'Supplier'      @mandatory;
  orderDate   : Date          @title: 'Order Date'    @mandatory;
  status      : String(20)    @title: 'Status'        default 'New'; // New -> Submitted -> Approved / Rejected (stage 3)
  currency    : String(3)     @title: 'Currency'      default 'USD';
  totalAmount : Decimal(15,2) @title: 'Total Amount';
  // Composition = items belong to the PO (deleted with it, saved together with it)
  items       : Composition of many PurchaseOrderItems on items.parent = $self;
}

// Purchase order items
entity PurchaseOrderItems : cuid {
  parent      : Association to PurchaseOrders;
  itemNo      : Integer       @title: 'Item';
  material    : String(40)    @title: 'Material'      @mandatory;
  description : String(100)   @title: 'Description';
  quantity    : Decimal(13,3) @title: 'Quantity'      @mandatory;
  unit        : String(3)     @title: 'Unit'          default 'EA';
  unitPrice   : Decimal(15,2) @title: 'Unit Price'    @mandatory;
  netAmount   : Decimal(15,2) @title: 'Net Amount';
}
