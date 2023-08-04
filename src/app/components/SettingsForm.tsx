import * as React from "react";
import { useState } from "react";
import "../styles/panel.css";

function SettingsForm() {
  const [selectedOption, setSelectedOption] = useState("default");

  const handleOptionChange = event => {
    setSelectedOption(event.target.value);
    handleSubmit(event.target.value);
  };

  const handleSubmit = event => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "update-configuration",
          configuration: event
        }
      },
      "*"
    );
  };

  return (
    <div className="settings-row">
      <div className="settings-form" onSubmit={handleSubmit}>
        <h3 className="settings-title">Configuration</h3>
        <div className="settings-label">
          Set your preferred configuration based on product.
        </div>
        <div className="settings-checkbox-group">
          <label
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <input
              name="vectorsRadio"
              type="radio"
              value="default"
              checked={selectedOption === "default"}
              onChange={handleOptionChange}
            />
            Platform
          </label>
        </div>
        <div className="settings-checkbox-group">
          <label
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <input
              type="radio"
              value="docv"
              checked={selectedOption === "docv"}
              onChange={handleOptionChange}
            />
            DocV Mobile SDK
          </label>
        </div>
      </div>
    </div>
  );
}

export default SettingsForm;
