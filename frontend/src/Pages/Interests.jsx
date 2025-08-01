import React, { useState } from "react";
import { Plus, X } from "lucide-react";

import { useNavigate } from "react-router-dom";

const Interests = () => {
  const [customInterest, setCustomInterest] = useState("");
  const [selectedInterests, setSelectedInterests] = useState(new Set());
  const [customInterests, setCustomInterests] = useState([]);

  const navigate = useNavigate();

  const popularInterests = [
    "Technology",
    "Music",
    "Movies",
    "Sports",
    "Travel",
    "Books",
    "Photography",
    "Cooking",
  ];

  const handleAddCustomInterest = () => {
    if (
      customInterest.trim() &&
      !customInterests.includes(customInterest.trim())
    ) {
      setCustomInterests([...customInterests, customInterest.trim()]);
      setSelectedInterests(
        new Set([...selectedInterests, customInterest.trim()])
      );
      setCustomInterest("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddCustomInterest();
    }
  };

  const toggleInterest = (interest) => {
    const newSelected = new Set(selectedInterests);
    if (newSelected.has(interest)) {
      newSelected.delete(interest);
    } else {
      newSelected.add(interest);
    }
    setSelectedInterests(newSelected);
  };

  const removeCustomInterest = (interest) => {
    setCustomInterests(customInterests.filter((i) => i !== interest));
    const newSelected = new Set(selectedInterests);
    newSelected.delete(interest);
    setSelectedInterests(newSelected);
  };

  const handleStartChat = () => {
    //Navigate to matchmaking
    console.log("Starting anonymous chat with interests:", [
      ...selectedInterests,
    ]);
    navigate("/anonymous-chat", {
      state: { interests: [...selectedInterests] },
    });
  };

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  };

  const cardStyle = {
    maxWidth: "800px",
    width: "100%",
    padding: "32px",
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    backdropFilter: "blur(4px)",
  };

  const inputStyle = {
    flex: 1,
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    outline: "none",
    fontSize: "16px",
    color: "#374151",
    backgroundColor: "#f9fafb",
  };

  const buttonStyle = {
    padding: "12px 24px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  };

  const interestButtonStyle = (isSelected) => ({
    padding: "16px",
    backgroundColor: isSelected ? "#f3f4f6" : "#f9fafb",
    border: isSelected ? "2px solid #7c3aed" : "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    color: isSelected ? "#7c3aed" : "#374151",
    transition: "all 0.2s ease",
    textAlign: "center",
    minHeight: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  };

  const tagStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#ddd6fe",
    color: "#6b21a8",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
  };

  const removeButtonStyle = {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Add Custom Interest Section */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            Add Custom Interest
          </h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your interest..."
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#7c3aed";
                e.target.style.boxShadow = "0 0 0 3px rgba(124, 58, 237, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleAddCustomInterest}
              disabled={!customInterest.trim()}
              style={{
                ...buttonStyle,
                backgroundColor: !customInterest.trim() ? "#9ca3af" : "#7c3aed",
                cursor: !customInterest.trim() ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (customInterest.trim()) {
                  e.target.style.backgroundColor = "#6d28d9";
                }
              }}
              onMouseLeave={(e) => {
                if (customInterest.trim()) {
                  e.target.style.backgroundColor = "#7c3aed";
                }
              }}
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>

        {/*PRoceed with anonymous chat*/}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleStartChat}
            style={{
              ...buttonStyle,
              backgroundColor:
                selectedInterests.size < 2 ? "#9ca3af" : "#7c3aed",
              cursor: selectedInterests.size < 2 ? "not-allowed" : "pointer",
            }}
            disabled={selectedInterests.size < 2}
            onMouseEnter={(e) => {
              if (selectedInterests.size >= 2) {
                e.target.style.backgroundColor = "#6d28d9";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedInterests.size >= 2) {
                e.target.style.backgroundColor = "#7c3aed";
              }
            }}
          >
            Start Anonymous Chat
          </button>
        </div>

        {/* Popular Interests Section */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            Popular Interests
          </h2>
          <div style={gridStyle}>
            {popularInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                style={interestButtonStyle(selectedInterests.has(interest))}
                onMouseEnter={(e) => {
                  if (!selectedInterests.has(interest)) {
                    e.target.style.borderColor = "#a855f7";
                    e.target.style.backgroundColor = "#faf5ff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedInterests.has(interest)) {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.backgroundColor = "#f9fafb";
                  }
                }}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Interests Summary */}
        {selectedInterests.size > 0 && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "12px",
              }}
            >
              Selected Interests ({selectedInterests.size})
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {Array.from(selectedInterests).map((interest) => (
                <span
                  key={interest}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {interest}
                  <button
                    onClick={() => removeCustomInterest(interest)}
                    style={removeButtonStyle}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#c4b5fd";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Interests;
