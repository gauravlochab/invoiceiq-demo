import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
            lineHeight: 1,
          }}
        >
          404
        </h1>

        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          Page not found
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--acl-primary)",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
