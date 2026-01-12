"use client";
import React from "react";
import {
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import { AppHeader } from "@/components/app-header";
import { TrendingUp, Eye, Edit, Download } from "lucide-react";

export default function Dashboard() {
  const materialTypeData = [
    {
      name: "Carbon Steel",
      count: 200,
    },
    {
      name: "Stainless Steel",
      count: 120,
    },
    {
      name: "Aluminium",
      count: 100,
    },
  ];

  type StatusType = "Complete" | "Pending" | "Review";

  const recentEquipmentData: Array<{
    id: string;
    type: string;
    material: string;
    pressure: string;
    temp: string;
    status: StatusType;
  }> = [
    {
      id: "PV-101",
      type: "Pressure Vessel",
      material: "SA-516 (CS)",
      pressure: "4.0 barg",
      temp: "100°C",
      status: "Complete" as const,
    },
    {
      id: "HE-205",
      type: "Heat Exchanger",
      material: "SA-240 (SS)",
      pressure: "5.0 barg",
      temp: "500°C",
      status: "Complete" as const,
    },
    {
      id: "PV-102",
      type: "Pressure Vessel",
      material: "SA-283 (CS)",
      pressure: "3.5 barg",
      temp: "80°C",
      status: "Review" as const,
    },
    {
      id: "HE-206",
      type: "Heat Exchanger",
      material: "SA-213 (SS)",
      pressure: "6.0 barg",
      temp: "450°C",
      status: "Complete" as const,
    },
    {
      id: "PV-103",
      type: "Pressure Vessel",
      material: "SA-516 (CS)",
      pressure: "4.5 barg",
      temp: "120°C",
      status: "Pending" as const,
    },
  ];

  const StatusBadge = ({ status }: { status: StatusType }) => {
    const colors: Record<StatusType, string> = {
      Complete: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Review: "bg-orange-100 text-orange-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen p-4">
      <AppHeader />

      <div className="flex items-center justify-center">
        {/* kpi cards -- start */}
        <div className="flex justify-center gap-6 mb-6 w-1/2 pt-4 ">
          <div className="bg-card rounded-lg border shadow-xs p-6">
            <div className="flex flex-col items-start justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Total Equipment
              </p>
              <p className="text-3xl font-bold text-card-foreground mt-2">
                243
              </p>
              <p className="text-xs text-green-600 flex items-center gap-2">
                <TrendingUp size={12} /> +12 this week
              </p>
            </div>
          </div>
          <div className="bg-card rounded-lg border shadow-xs p-6">
            <div className="flex flex-col items-start justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Pending Extraction
              </p>
              <p className="text-3xl font-bold text-card-foreground mt-2">10</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2"></p>
            </div>
          </div>
          <div className="bg-card rounded-lg border shadow-xs p-6">
            <div className="flex flex-col items-start justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Completed Today
              </p>
              <p className="text-3xl font-bold text-card-foreground mt-2">10</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2"></p>
            </div>
          </div>
          <div className="bg-card rounded-lg border shadow-xs p-6">
            <div className="flex flex-col items-start justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Inspection Plans
              </p>
              <p className="text-3xl font-bold text-card-foreground mt-2">10</p>
              <p className="text-xs text-green-600 flex items-centergap-2"></p>
            </div>
          </div>
        </div>
        {/* kpi cards -- end */}
      </div>

      <div className="flex items-center justify-center">
        {/* material type -- start -- bar chart */}
        <div className="w-1/3 h-80 rounded-lg border bg-card shadow-xs p-6 m-2">
          <h3 className="font-semibold mb-3 text-card-foreground">
            Material Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={materialTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#989898ff" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#b05730" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* material type -- end */}
      </div>

      <div className="grid grid-cols-1 lgL:grid-cols-2 gap-6">
        {/* recent equipment table start */}
        <div className="lg:col-span-2 bg-card rounded-lg border shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              Recently Processed Equipment
            </h3>
            <button className="text-sm text-primary hover:text-primary/80 font-medium cursor-pointer">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                    Tag
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                    Material
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                    Design P/T
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEquipmentData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-card-foreground">
                      {item.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.type}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.material}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.pressure} / {item.temp}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button className="text-primary hover:text-primary/80 cursor-pointer">
                          <Eye size={16} />
                        </button>
                        <button className="text-primary hover:text-primary/80 cursor-pointer">
                          <Edit size={16} />
                        </button>
                        <button className="text-primary hover:text-primary/80 cursor-pointer">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
