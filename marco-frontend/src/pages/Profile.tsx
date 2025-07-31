export default function Profile() {
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p className="mb-4">View and edit your profile information.</p>
      <form>
        <label className="block mb-2">
          Username:
          <input
            type="text"
            className="w-full mt-1 p-2 border rounded"
            placeholder="Your username"
            disabled
          />
        </label>
        <label className="block mb-4">
          Email:
          <input
            type="email"
            className="w-full mt-1 p-2 border rounded"
            placeholder="you@example.com"
            disabled
          />
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded cursor-not-allowed opacity-50"
          disabled
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
