import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import ExecutionLog from "@/components/ExecutionLog";

export default function Home() {
  return (
    <>
      <TopBar />
      <Sidebar />

      <main className="ml-64 p-8">

        <h1 className="text-3xl text-white font-bold">
          Sentient Capital AI Fund
        </h1>

        <ExecutionLog />

      </main>

    </>
  );
}
