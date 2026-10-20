export function SupplyChainPreview() {
  return (
    <figure className="border border-line bg-paper-raised p-6">
      <svg
        viewBox="0 0 720 280"
        role="img"
        aria-labelledby="preview-title preview-desc"
        className="h-auto w-full"
      >
        <title id="preview-title">Supply-chain dependency preview</title>
        <desc id="preview-desc">
          Supplier A feeds raw inventory, which supports two production lines that
          fulfill customer orders. A delay at Supplier A is the origin of the
          disruption.
        </desc>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5f584f" />
          </marker>
        </defs>
        <line x1="150" y1="80" x2="250" y2="140" stroke="#5f584f" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="370" y1="140" x2="470" y2="70" stroke="#5f584f" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="370" y1="160" x2="470" y2="210" stroke="#5f584f" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="590" y1="70" x2="690" y2="70" stroke="#5f584f" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="590" y1="210" x2="690" y2="210" stroke="#5f584f" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <rect x="20" y="48" width="130" height="64" fill="#dce8e5" stroke="#1f4d4a" />
        <text x="85" y="75" textAnchor="middle" fill="#1b1916" fontSize="13">
          Supplier A
        </text>
        <text x="85" y="94" textAnchor="middle" fill="#1f4d4a" fontSize="11">
          origin
        </text>
        <rect x="250" y="118" width="120" height="54" fill="#fbf8f1" stroke="#1b1916" />
        <text x="310" y="150" textAnchor="middle" fill="#1b1916" fontSize="13">
          Inventory
        </text>
        <rect x="470" y="43" width="120" height="54" fill="#fbf8f1" stroke="#1b1916" />
        <text x="530" y="75" textAnchor="middle" fill="#1b1916" fontSize="13">
          Production 1
        </text>
        <rect x="470" y="183" width="120" height="54" fill="#fbf8f1" stroke="#1b1916" />
        <text x="530" y="215" textAnchor="middle" fill="#1b1916" fontSize="13">
          Production 2
        </text>
        <rect x="620" y="43" width="90" height="54" fill="#fbf8f1" stroke="#1b1916" />
        <text x="665" y="75" textAnchor="middle" fill="#1b1916" fontSize="13">
          Order 42
        </text>
        <rect x="620" y="183" width="90" height="54" fill="#fbf8f1" stroke="#1b1916" />
        <text x="665" y="215" textAnchor="middle" fill="#1b1916" fontSize="13">
          Order 18
        </text>
      </svg>
      <figcaption className="mt-4 text-sm text-ink-muted">
        A delay at Supplier A is not a dashboard metric. It is a change that must
        be propagated through inventory, production, and order deadlines.
      </figcaption>
    </figure>
  );
}
