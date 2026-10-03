import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/dashboard_stats_model.dart';

class RevenueTrendChart extends StatelessWidget {
  final List<MonthTrendItem> data;

  const RevenueTrendChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return _buildEmptyState('No revenue trend data available');
    }

    final barGroups = <BarChartGroupData>[];
    for (int i = 0; i < data.length && i < 6; i++) {
      final item = data[i];
      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: item.value1 > 0 ? item.value1 / 1000 : 1.0, // in thousands
              color: AppColors.primary,
              width: 12,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
            BarChartRodData(
              toY: item.value2 > 0 ? item.value2 / 1000 : 0.5,
              color: const Color(0xFFF59E0B),
              width: 12,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
          ],
        ),
      );
    }

    return AspectRatio(
      aspectRatio: 1.8,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          borderData: FlBorderData(show: false),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (val) => FlLine(
              color: AppColors.borderLight,
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (val, meta) {
                  final idx = val.toInt();
                  if (idx >= 0 && idx < data.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        data[idx].month,
                        style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
          barGroups: barGroups,
        ),
      ),
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Text(msg, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
    );
  }
}

class LeadAcquisitionChart extends StatelessWidget {
  final List<MonthTrendItem> data;

  const LeadAcquisitionChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(
        child: Text('No lead acquisition trend data', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
      );
    }

    final spots1 = <FlSpot>[];
    final spots2 = <FlSpot>[];
    for (int i = 0; i < data.length && i < 8; i++) {
      spots1.add(FlSpot(i.toDouble(), data[i].value1));
      spots2.add(FlSpot(i.toDouble(), data[i].value2));
    }

    return AspectRatio(
      aspectRatio: 1.8,
      child: LineChart(
        LineChartData(
          borderData: FlBorderData(show: false),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(color: AppColors.borderLight, strokeWidth: 1),
          ),
          titlesData: FlTitlesData(
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (val, meta) {
                  final idx = val.toInt();
                  if (idx >= 0 && idx < data.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        data[idx].month,
                        style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots1,
              isCurved: true,
              color: AppColors.primary,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: AppColors.primary.withValues(alpha: 0.12),
              ),
            ),
            LineChartBarData(
              spots: spots2,
              isCurved: true,
              color: AppColors.success,
              barWidth: 2.5,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: AppColors.success.withValues(alpha: 0.08),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class WeeklyAttendanceBarChart extends StatelessWidget {
  final List<double> dailyHours; // e.g. [8.0, 7.5, 8.5, 9.0, 8.0, 0.0, 0.0]
  final List<String> days; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const WeeklyAttendanceBarChart({
    super.key,
    this.dailyHours = const [8.0, 8.5, 7.8, 8.2, 8.0, 4.0, 0.0],
    this.days = const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 2.0,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: 10,
          borderData: FlBorderData(show: false),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (val) => FlLine(
              color: AppColors.borderLight,
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                getTitlesWidget: (val, meta) {
                  if (val == 0 || val == 4 || val == 8) {
                    return Text('${val.toInt()}h', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary));
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (val, meta) {
                  final idx = val.toInt();
                  if (idx >= 0 && idx < days.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(days[idx], style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
          barGroups: List.generate(dailyHours.length, (i) {
            final h = dailyHours[i];
            final isWeekend = i >= 5;
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: h,
                  color: isWeekend
                      ? AppColors.textSecondary.withValues(alpha: 0.3)
                      : (h >= 8.0 ? AppColors.primary : const Color(0xFFF59E0B)),
                  width: 14,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                  backDrawRodData: BackgroundBarChartRodData(
                    show: true,
                    toY: 9.0,
                    color: AppColors.surfaceSubtle,
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class AttendanceDonutChart extends StatelessWidget {
  final int present;
  final int absent;
  final int late;

  const AttendanceDonutChart({
    super.key,
    required this.present,
    required this.absent,
    required this.late,
  });

  @override
  Widget build(BuildContext context) {
    final total = present + absent + late;
    if (total == 0) {
      return const Center(
        child: Text('No attendance punches recorded today', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
      );
    }

    return Row(
      children: [
        SizedBox(
          width: 130,
          height: 130,
          child: PieChart(
            PieChartData(
              sectionsSpace: 3,
              centerSpaceRadius: 36,
              sections: [
                if (present > 0)
                  PieChartSectionData(
                    value: present.toDouble(),
                    color: AppColors.success,
                    title: '$present',
                    titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    radius: 22,
                  ),
                if (absent > 0)
                  PieChartSectionData(
                    value: absent.toDouble(),
                    color: AppColors.danger,
                    title: '$absent',
                    titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    radius: 22,
                  ),
                if (late > 0)
                  PieChartSectionData(
                    value: late.toDouble(),
                    color: AppColors.warning,
                    title: '$late',
                    titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    radius: 22,
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegend('Present', present, AppColors.success),
              const SizedBox(height: 6),
              _buildLegend('Absent', absent, AppColors.danger),
              const SizedBox(height: 6),
              _buildLegend('Late', late, AppColors.warning),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLegend(String label, int count, Color color) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ),
        Text(
          '$count',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ],
    );
  }
}
