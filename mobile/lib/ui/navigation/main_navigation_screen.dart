import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../dashboard/dashboard_screen.dart';
import '../employee/attendance_screen.dart';
import '../employee/tasks_screen.dart';
import '../finance/salary_slips_screen.dart';
import '../sales/leads_list_screen.dart';
import '../widgets/app_drawer.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  void _onTabSelected(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isSales = user?.isSalesDepartment ?? false;

    // Dynamically build screens and destinations based on department
    final List<Widget> screens = [
      DashboardScreen(onNavigateTab: _onTabSelected),
      if (isSales) const LeadsListScreen(),
      const AttendanceScreen(),
      const TasksScreen(),
      const SalarySlipsScreen(),
    ];

    final List<NavigationDestination> destinations = [
      const NavigationDestination(
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard_rounded),
        label: 'Home',
      ),
      if (isSales)
        const NavigationDestination(
          icon: Icon(Icons.trending_up_outlined),
          selectedIcon: Icon(Icons.trending_up_rounded),
          label: 'Sales',
        ),
      const NavigationDestination(
        icon: Icon(Icons.fingerprint_outlined),
        selectedIcon: Icon(Icons.fingerprint_rounded),
        label: 'Punch In',
      ),
      const NavigationDestination(
        icon: Icon(Icons.task_alt_outlined),
        selectedIcon: Icon(Icons.task_alt_rounded),
        label: 'Tasks',
      ),
      const NavigationDestination(
        icon: Icon(Icons.receipt_long_outlined),
        selectedIcon: Icon(Icons.receipt_long_rounded),
        label: 'Salary Slips',
      ),
    ];

    final safeIndex = _currentIndex.clamp(0, screens.length - 1);

    return Scaffold(
      drawer: AppDrawer(
        currentIndex: safeIndex,
        onSelectTab: _onTabSelected,
      ),
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: safeIndex,
        onDestinationSelected: _onTabSelected,
        destinations: destinations,
      ),
    );
  }
}
