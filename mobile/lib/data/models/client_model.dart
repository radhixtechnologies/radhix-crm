class ClientModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String company;
  final String industry;
  final String status;
  final double totalRevenue;
  final String? city;
  final String? state;

  ClientModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone = '',
    required this.company,
    this.industry = '',
    this.status = 'active',
    this.totalRevenue = 0.0,
    this.city,
    this.state,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) {
    String? city;
    String? state;
    if (json['address'] is Map) {
      final addr = json['address'] as Map;
      city = addr['city']?.toString();
      state = addr['state']?.toString();
    }

    return ClientModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      company: (json['company'] ?? '').toString(),
      industry: (json['industry'] ?? '').toString(),
      status: (json['status'] ?? 'active').toString(),
      totalRevenue: (json['totalRevenue'] is num) ? (json['totalRevenue'] as num).toDouble() : 0.0,
      city: city,
      state: state,
    );
  }
}
