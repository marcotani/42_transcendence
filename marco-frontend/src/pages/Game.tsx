export default function Game() {
  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 bg-black rounded shadow text-white">
      <h1 className="text-3xl font-bold mb-6">Pong Game Screen</h1>
      <p>The game arena will be displayed here.</p>
      <div className="mt-8 border-4 border-white rounded aspect-video flex items-center justify-center">
        <p className="text-gray-400">[Game Canvas Placeholder]</p>
      </div>
    </div>
  );
}
