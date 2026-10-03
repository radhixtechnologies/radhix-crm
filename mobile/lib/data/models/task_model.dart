class TaskModel {
  final String id;
  final String title;
  final String description;
  final String priority;
  final String status;
  final DateTime? dueDate;
  final DateTime? createdAt;

  TaskModel({
    required this.id,
    required this.title,
    this.description = '',
    this.priority = 'medium',
    this.status = 'pending',
    this.dueDate,
    this.createdAt,
  });

  bool get isCompleted =>
      status == 'completed' ||
      status == 'approved_by_admin' ||
      status == 'approved_by_superadmin';

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      priority: (json['priority'] ?? 'medium').toString(),
      status: (json['status'] ?? 'pending').toString(),
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}
