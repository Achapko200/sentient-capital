"use client";

import { useState } from "react";

type Execution = {
  id: number;
  agent: string;
  action: string;
  ticker: string;
  price: string;
  status: string;
  time: string;
};

export default function ExecutionLog() {
  const [executions] = useState<Execution[]>([
    {
      id: 1,
      agent: "Alpha Agent",
      action: "BUY",
      ticker: "NVDA",
      price: "$142.50",
      status: "Executed",
      time: "10:32:15",
    },
    {
      id: 2,
      agent: "Risk Agent",
      action: "HEDGE",
      ticker: "SPY PUT",
      price: "$3.20",
      status: "Executed",
      time: "10:35:44",
    },
    {
      id: 3,
      agent: "Macro Agent",
      action: "SELL",
      ticker: "TSLA",
      price: "$410.10",
      status: "Pending",
      time: "10:41:02",
    },
    {
      id: 4,
      agent: "Quant Agent",
      action: "REBALANCE",
      ticker: "PORTFOLIO",
      price: "—",
      status: "Completed",
      time: "10:45:20",
    },
  ]);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 mt-6">

      <div className="flex justify-between items-center mb-5">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Execution Log
          </h2>

          <p className="text-sm text-gray-400">
            Real-time AI trading activity
          </p>
        </div>


        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
          AI Engine Online
        </div>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full text-left">

          <thead className="text-gray-400 text-sm border-b border-gray-800">

            <tr>
              <th className="py-3">Agent</th>
              <th>Action</th>
              <th>Ticker</th>
              <th>Price</th>
              <th>Status</th>
              <th>Time</th>
            </tr>

          </thead>


          <tbody>

            {executions.map((trade)=>(

              <tr 
                key={trade.id}
                className="border-b border-gray-900 hover:bg-white/5 transition"
              >

                <td className="py-4 text-white">
                  {trade.agent}
                </td>


                <td>

                  <span
                    className={
                      trade.action === "BUY"
                      ? "text-green-400"
                      : trade.action === "SELL"
                      ? "text-red-400"
                      : "text-yellow-400"
                    }
                  >
                    {trade.action}
                  </span>

                </td>


                <td className="text-gray-300">
                  {trade.ticker}
                </td>


                <td className="text-gray-300">
                  {trade.price}
                </td>


                <td>

                  <span className="
                    px-2 py-1 
                    rounded-md
                    text-xs
                    bg-white/5
                    text-gray-200
                  ">

                    {trade.status}

                  </span>

                </td>


                <td className="text-gray-500">
                  {trade.time}
                </td>


              </tr>

            ))}


          </tbody>


        </table>


      </div>


    </div>
  );
}