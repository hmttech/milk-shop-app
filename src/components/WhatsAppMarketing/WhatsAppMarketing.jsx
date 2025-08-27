import React, { useState, useMemo } from 'react';

function WhatsAppMarketing({ state, setNotif }) {
  const [message, setMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState('general');

  // Collect unique religion tags
  const religionTags = Array.from(new Set(state.customers.map((c) => c.religion).filter(Boolean)));

  // Filter customers by tag
  const recipients = useMemo(() => {
    if (selectedTag === 'general') return state.customers.filter((c) => c.general && c.phone);
    return state.customers.filter((c) => c.religion === selectedTag && c.phone);
  }, [selectedTag, state.customers]);

  function sendMarketing() {
    recipients.forEach((c) => {
      const waLink = `https://wa.me/${(c.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(waLink, '_blank');
    });
    setNotif(`Sent to ${recipients.length} customers.`);
    setTimeout(() => setNotif(''), 2000);
  }

  return (
    <div>
      <h2>WhatsApp Marketing</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="general">General</option>
          {religionTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <input
          placeholder="Type your marketing message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          className="primary"
          onClick={sendMarketing}
          disabled={!message || recipients.length === 0}
        >
          Send to {recipients.length} users
        </button>
      </div>
      <div>
        {recipients.length === 0 ? (
          <div className="muted">No recipients for selected tag.</div>
        ) : (
          <ul>
            {recipients.map((c) => (
              <li key={c.id}>
                {c.name} ({c.phone})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default WhatsAppMarketing;
