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
  bool get isAdmin =>
      role == 'admin' || role == 'super_admin' || role.endsWith('_admin') || role.endsWith('_manager');
  bool get isEmployee => role == 'employee' || role.endsWith('_employee');

  /// Only members of the Sales department (or full admins) can access Sales & Leads
  bool get isSalesDepartment {
    if (isSuperAdmin) return true;
    final dept = department.trim().toLowerCase();
    final r = role.toLowerCase();
    if (dept == 'sales') return true;
    if (r == 'sales_employee' || r == 'sales_manager' || r == 'sales_admin') return true;
    if (r == 'admin' && (dept.isEmpty || dept == 'management' || dept == 'sales')) return true;
    return false;
  }

  bool hasModuleAccess(String module) {
    if (isSuperAdmin) return true;
    if (module == 'sales' || module == 'leads') return isSalesDepartment;
    return modulesAccess[module] == true || module == 'employee';
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final roleValue = json['role'];
    final roleData = roleValue is Map ? Map<String, dynamic>.from(roleValue) : <String, dynamic>{};
    final roleModules = roleData['modules'];
    final modules = json['modulesAccess'] is Map
        ? Map<String, dynamic>.from(json['modulesAccess'])
        : <String, dynamic>{};
    if (roleModules is List) {
      for (final module in roleModules) {
        if (module is String) modules.putIfAbsent(module, () => true);
      }
    }

    final empObj = json['employee'] is Map ? json['employee'] as Map : null;
    final dept = (json['department'] ?? empObj?['department'] ?? '').toString();

    return UserModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (roleData['slug'] ?? roleValue ?? 'employee').toString(),
      department: dept,
      avatar: (json['avatar'] ?? '').toString(),
      isActive: json['isActive'] ?? true,
      modulesAccess: modules,
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
