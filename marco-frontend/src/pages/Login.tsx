export default function Login() {
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form>
        <label className="block mb-2">
          Email:
          <input
            type="email"
            className="w-full mt-1 p-2 border rounded"
            placeholder="you@example.com"
            disabled
          />
        </label>
        <label className="block mb-4">
          Password:
          <input
            type="password"
            className="w-full mt-1 p-2 border rounded"
            placeholder="••••••••"
            disabled
          />
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded cursor-not-allowed opacity-50"
          disabled
        >
          Login
        </button>
      </form>
    </div>
  );
}
