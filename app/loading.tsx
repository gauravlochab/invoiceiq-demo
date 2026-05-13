export default function Loading() {
  return (
    <div style={{ padding: "32px 32px 48px" }}>
      <div
        className="animate-pulse"
        style={{
          height: 40,
          width: 320,
          backgroundColor: "var(--bg-subtle)",
          borderRadius: 8,
          marginBottom: 32,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              className="animate-pulse"
              style={{
                height: 12,
                width: 96,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
                marginBottom: 16,
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 28,
                width: 72,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
                marginBottom: 12,
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 10,
                width: 64,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div
          className="animate-pulse"
          style={{
            height: 14,
            width: 160,
            backgroundColor: "var(--bg-subtle)",
            borderRadius: 6,
            marginBottom: 24,
          }}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              className="animate-pulse"
              style={{
                height: 12,
                flex: 2,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 12,
                flex: 1,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 12,
                flex: 1,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 12,
                width: 80,
                backgroundColor: "var(--bg-subtle)",
                borderRadius: 6,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
