class InvoiceModel {
  final String id;
  final String invoiceNumber;
  final String clientName;
  final double total;
  final double amountPaid;
  final double balanceDue;
  final String status;
  final DateTime dueDate;
  final DateTime issueDate;
  final int itemsCount;

  InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.clientName,
    required this.total,
    this.amountPaid = 0.0,
    this.balanceDue = 0.0,
    this.status = 'pending',
    required this.dueDate,
    required this.issueDate,
    this.itemsCount = 1,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    String client = 'Customer';
    if (json['client'] is Map) {
      client = (json['client'] as Map)['name'] ?? (json['client'] as Map)['company'] ?? 'Customer';
    } else if (json['client'] != null) {
      client = json['client'].toString();
    }

    final items = json['items'] as List? ?? [];

    return InvoiceModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      invoiceNumber: (json['invoiceNumber'] ?? 'INV-0000').toString(),
      clientName: client,
      total: (json['total'] is num) ? (json['total'] as num).toDouble() : 0.0,
      amountPaid: (json['amountPaid'] is num) ? (json['amountPaid'] as num).toDouble() : 0.0,
      balanceDue: (json['balanceDue'] is num) ? (json['balanceDue'] as num).toDouble() : 0.0,
      status: (json['status'] ?? 'pending').toString(),
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      issueDate: json['issueDate'] != null
          ? DateTime.tryParse(json['issueDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      itemsCount: items.length,
    );
  }
}
