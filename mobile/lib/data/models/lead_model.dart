class LeadNote {
  final String content;
  final String? addedBy;
  final DateTime? addedAt;

  LeadNote({required this.content, this.addedBy, this.addedAt});

  factory LeadNote.fromJson(Map<String, dynamic> json) {
    return LeadNote(
      content: json['content']?.toString() ?? '',
      addedBy: json['addedBy'] is Map ? json['addedBy']['name']?.toString() : json['addedBy']?.toString(),
      addedAt: json['addedAt'] != null ? DateTime.tryParse(json['addedAt'].toString()) : null,
    );
  }
}

class LeadModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String company;
  final String source;
  final String status;
  final String leadTemperature;
  final double value;
  final String currency;
  final String? assignedToName;
  final List<LeadNote> notes;
  final DateTime? createdAt;

  LeadModel({
    required this.id,
    required this.name,
    this.email = '',
    this.phone = '',
    this.company = '',
    this.source = 'website',
    this.status = 'new',
    this.leadTemperature = 'cold',
    this.value = 0.0,
    this.currency = 'INR',
    this.assignedToName,
    this.notes = const [],
    this.createdAt,
  });

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    String? assignedName;
    if (json['assignedTo'] is Map) {
      final aMap = json['assignedTo'] as Map;
      assignedName = aMap['name'] ?? aMap['user']?['name'];
    }

    final rawNotes = json['notes'] as List? ?? [];
    final parsedNotes = rawNotes
        .whereType<Map<String, dynamic>>()
        .map((n) => LeadNote.fromJson(n))
        .toList();

    return LeadModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      company: (json['company'] ?? '').toString(),
      source: (json['source'] ?? 'website').toString(),
      status: (json['status'] ?? 'new').toString(),
      leadTemperature: (json['leadTemperature'] ?? 'cold').toString(),
      value: (json['value'] is num) ? (json['value'] as num).toDouble() : 0.0,
      currency: (json['currency'] ?? 'INR').toString(),
      assignedToName: assignedName,
      notes: parsedNotes,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'company': company,
      'source': source,
      'status': status,
      'leadTemperature': leadTemperature,
      'value': value,
      'currency': currency,
    };
  }
}
