export default function Home() {
  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-6">Home Dashboard</h1>
      <p className="mb-4">Welcome back! Here's a quick overview of your recent activity.</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 rounded">Recent Matches</div>
        <div className="p-4 bg-green-100 rounded">Leaderboard</div>
        <div className="p-4 bg-yellow-100 rounded">Friend Requests</div>
      </div>
    </div>
  );
}
