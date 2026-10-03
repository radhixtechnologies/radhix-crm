class DealModel {
  final String id;
  final String title;
  final double value;
  final String stage;
  final int probability;
  final DateTime? expectedCloseDate;
  final String? clientName;
  final String? contactName;
  final DateTime? createdAt;

  DealModel({
    required this.id,
    required this.title,
    this.value = 0.0,
    this.stage = 'lead',
    this.probability = 0,
    this.expectedCloseDate,
    this.clientName,
    this.contactName,
    this.createdAt,
  });

  factory DealModel.fromJson(Map<String, dynamic> json) {
    String? cName;
    if (json['client'] is Map) {
      cName = (json['client'] as Map)['name']?.toString();
    }

    return DealModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? json['name'] ?? 'Untitled Deal').toString(),
      value: (json['value'] is num) ? (json['value'] as num).toDouble() : 0.0,
      stage: (json['stage'] ?? 'lead').toString(),
      probability: (json['probability'] is num) ? (json['probability'] as num).toInt() : 0,
      expectedCloseDate: json['expectedCloseDate'] != null
          ? DateTime.tryParse(json['expectedCloseDate'].toString())
          : null,
      clientName: cName ?? json['company']?.toString(),
      contactName: json['contactName']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}
