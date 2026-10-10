using POService as service from '../../srv/po-service';

// ---------- Purchase Order header ----------
annotate service.PurchaseOrders with @(
  // Filter bar on the List Report
  UI.SelectionFields: [ poNumber, supplier, status, orderDate ],

  // Table columns on the List Report
  UI.LineItem: [
    { Value: poNumber },
    { Value: supplier },
    { Value: orderDate },
    { Value: totalAmount },
    { Value: currency },
    { Value: status }
  ],

  // Title area of the Object Page
  UI.HeaderInfo: {
    TypeName      : 'Purchase Order',
    TypeNamePlural: 'Purchase Orders',
    Title         : { Value: poNumber },
    Description   : { Value: supplier }
  },

  UI.FieldGroup #General: {
    Data: [
      { Value: supplier },
      { Value: orderDate },
      { Value: currency }
    ]
  },

  UI.FieldGroup #Status: {
    Data: [
      { Value: status },
      { Value: totalAmount },
      { Value: createdBy },
      { Value: createdAt }
    ]
  },

  // Sections on the Object Page
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', ID: 'General', Label: 'General Information', Target: '@UI.FieldGroup#General' },
    { $Type: 'UI.ReferenceFacet', ID: 'Status',  Label: 'Status',              Target: '@UI.FieldGroup#Status' },
    { $Type: 'UI.ReferenceFacet', ID: 'Items',   Label: 'Items',               Target: 'items/@UI.LineItem' }
  ]
);

// ---------- Purchase Order items ----------
annotate service.PurchaseOrderItems with @(
  UI.LineItem: [
    { Value: itemNo },
    { Value: material },
    { Value: description },
    { Value: quantity },
    { Value: unit },
    { Value: unitPrice },
    { Value: netAmount }
  ]
);
