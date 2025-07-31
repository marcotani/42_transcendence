export default function Matchmaking() {
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Matchmaking</h1>
      <p className="mb-4">Find other players to start a game.</p>
      <button
        className="w-full bg-purple-600 text-white py-2 rounded cursor-not-allowed opacity-50"
        disabled
      >
        Start Searching
      </button>
    </div>
  );
}
