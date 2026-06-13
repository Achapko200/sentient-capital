"use client"

type Agent = {
  name: string
  role: string
  status: string
  confidence: number
  action: string
}


export default function AgentPanel() {


const agents:Agent[] = [

{
name:"Alpha",
role:"Research Analyst",
status:"Analyzing markets",
confidence:82,
action:"BUY NVDA"
},

{
name:"Guardian",
role:"Risk Manager",
status:"Checking exposure",
confidence:91,
action:"REDUCE RISK"
},

{
name:"Sentinel",
role:"Portfolio Manager",
status:"Making decision",
confidence:76,
action:"HOLD"
}

]


return (

<div className="grid gap-6 md:grid-cols-3">


{agents.map((agent)=>(

<div
key={agent.name}
className="
rounded-xl
border
border-gray-700
bg-black
p-6
shadow-lg
"
>


<h2 className="text-xl font-bold">
🤖 {agent.name}.eth
</h2>


<p className="text-gray-400">
{agent.role}
</p>


<div className="mt-4">


<p>
Status:
<span className="text-green-400">
 {" "}
{agent.status}
</span>
</p>


<p className="mt-2">
Confidence:
</p>


<div className="
h-2
bg-gray-800
rounded
mt-2
">

<div
className="
h-2
bg-green-500
rounded
"
style={{
width:`${agent.confidence}%`
}}
/>

</div>


<p className="mt-4 text-lg">

Decision:

<span className="text-blue-400">

 {" "}{agent.action}

</span>

</p>


</div>


</div>

))}


</div>

)

}
