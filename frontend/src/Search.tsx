import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function Search() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `http://localhost:3000/search?term=${encodeURIComponent(term)}`
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div>
      <h1>Search</h1>

      <form onSubmit={handleSearch}>
        <input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Search products"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error &&
        <p>
          {error}
        </p>}

      <ul>
        {results.map((item, i) =>
          <li key={i}>
            {JSON.stringify(item)}
          </li>
        )}
      </ul>

      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}

export default Search;
