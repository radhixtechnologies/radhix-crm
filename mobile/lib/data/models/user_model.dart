class UserModel {
  final String id;
  final String name;
  final String email;
  final String role; // 'super_admin', 'admin', 'employee'
  final String department;
  final String avatar;
  final bool isActive;
  final Map<String, dynamic> modulesAccess;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.department = '',
    this.avatar = '',
    this.isActive = true,
    this.modulesAccess = const {},
  });

  bool get isSuperAdmin => role == 'super_admin';
  bool get isAdmin => role == 'admin' || role == 'super_admin';
  bool get isEmployee => role == 'employee';

  bool hasModuleAccess(String module) {
    if (isSuperAdmin) return true;
    if (modulesAccess.isEmpty) return true;
    return modulesAccess[module] == true;
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'employee').toString(),
      department: (json['department'] ?? '').toString(),
      avatar: (json['avatar'] ?? '').toString(),
      isActive: json['isActive'] ?? true,
      modulesAccess: json['modulesAccess'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['modulesAccess'])
          : {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'department': department,
      'avatar': avatar,
      'isActive': isActive,
      'modulesAccess': modulesAccess,
    };
  }
}
