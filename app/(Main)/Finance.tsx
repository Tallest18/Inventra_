import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

const chartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const Finance = () => {
  const dummyFinanceData = [
    { label: "Total Profit", value: "₦120,400.30" },
    { label: "Total Revenue", value: "₦250,000.00" },
    { label: "Total Expenses", value: "₦129,599.70" },
    { label: "Sales this week", value: "₦25,000.00" },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Finance</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Revenue</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 32}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        {dummyFinanceData.map((item, index) => (
          <View key={index} style={styles.dataCard}>
            <Text style={styles.dataLabel}>{item.label}</Text>
            <Text style={styles.dataValue}>{item.value}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 10,
  },
  dataCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dataLabel: {
    fontSize: 16,
    color: "#555",
  },
  dataValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2046AE",
  },
});
export default Finance;
