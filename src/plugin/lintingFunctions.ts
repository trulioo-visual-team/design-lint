import theme from "./themeVariables.json";

// // Special Objects
// const overlayDefault = {
//   opacity: 0.2,
//   color: {
//     r: 0.07058823853731155,
//     g: 0.07058823853731155,
//     b: 0.07058823853731155
//   }
// };

// const overlayDocV = {
//   opacity: 0.5,
//   color: {
//     r: 0,
//     g: 0,
//     b: 0
//   }
// };

// Linting functions

// Generic function for creating an error object to pass to the app.
export function createErrorObject(node, type, message, value?) {
  let error = {
    message: "",
    type: "",
    node: "",
    value: ""
  };

  error.message = message;
  error.type = type;
  error.node = node;

  if (value !== undefined) {
    error.value = value;
  }

  return error;
}

// Determine a nodes fills
export function determineFill(fills) {
  let fillValues = [];

  fills.forEach(fill => {
    if (fill.type === "SOLID") {
      let rgbObj = convertColor(fill.color);
      fillValues.push(RGBToHex(rgbObj["r"], rgbObj["g"], rgbObj["b"]));
    } else if (fill.type === "IMAGE") {
      fillValues.push("Image - " + fill.imageHash);
    } else if (fill.type === "VIDEO") {
      fillValues.push("Video Fill");
    } else {
      const gradientValues = [];
      fill.gradientStops.forEach(gradientStops => {
        let gradientColorObject = convertColor(gradientStops.color);
        gradientValues.push(
          RGBToHex(
            gradientColorObject["r"],
            gradientColorObject["g"],
            gradientColorObject["b"]
          )
        );
      });
      let gradientValueString = gradientValues.toString();
      fillValues.push(`${fill.type} ${gradientValueString}`);
    }
  });

  return fillValues[0];
}

// Lint border radius
export function checkRadius(node, errors, radiusValues, configuration) {
  let cornerType = node.cornerRadius;

  if (typeof cornerType !== "symbol") {
    if (cornerType === 0) {
      return;
    }
    if (cornerType === node.height) {
      return;
    }
  }

  if (typeof node.boundVariables.bottomLeftRadius !== "undefined") {
    return;
  }

  // If the radius isn't even on all sides, check each corner.
  if (typeof cornerType === "symbol") {
    if (radiusValues.indexOf(node.topLeftRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect Top Left Radius",
          node.topRightRadius
        )
      );
    } else if (radiusValues.indexOf(node.topRightRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect top right radius",
          node.topRightRadius
        )
      );
    } else if (radiusValues.indexOf(node.bottomLeftRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect bottom left radius",
          node.bottomLeftRadius
        )
      );
    } else if (radiusValues.indexOf(node.bottomRightRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect bottom right radius",
          node.bottomRightRadius
        )
      );
    } else {
      return;
    }
  } else {
    if (radiusValues.indexOf(node.cornerRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect border radius",
          node.cornerRadius
        )
      );
    } else {
      return;
    }
  }
}

// Check for effects like shadows, blurs etc.
export function checkEffects(node, errors, configuration) {
  if (node.effects.length && node.visible === true) {
    if (node.effectStyleId === "") {
      const effectsArray = [];

      node.effects.forEach(effect => {
        let effectsObject = {
          type: "",
          radius: "",
          offsetX: "",
          offsetY: "",
          fill: "",
          value: ""
        };

        // All effects have a radius.
        effectsObject.radius = effect.radius;

        if (effect.type === "DROP_SHADOW") {
          effectsObject.type = "Drop Shadow";
        } else if (effect.type === "INNER_SHADOW") {
          effectsObject.type = "Inner Shadow";
        } else if (effect.type === "LAYER_BLUR") {
          effectsObject.type = "Layer Blur";
        } else {
          effectsObject.type = "Background Blur";
        }

        if (effect.color) {
          let effectsFill = convertColor(effect.color);
          effectsObject.fill = RGBToHex(
            effectsFill["r"],
            effectsFill["g"],
            effectsFill["b"]
          );
          effectsObject.offsetX = effect.offset.x;
          effectsObject.offsetY = effect.offset.y;
          effectsObject.value = `${effectsObject.type} ${effectsObject.fill} ${effectsObject.radius}px X: ${effectsObject.offsetX}, Y: ${effectsObject.offsetY}`;
        } else {
          effectsObject.value = `${effectsObject.type} ${effectsObject.radius}px`;
        }

        effectsArray.unshift(effectsObject);
      });

      let currentStyle = effectsArray[0].value;

      return errors.push(
        createErrorObject(
          node,
          "effects",
          "Missing effects style",
          currentStyle
        )
      );
    } else {
      return;
    }
  }
}

function overlayCheck(fill, configuration) {
  if (fill.hasOwnProperty("color")) {
    if (configuration === "default") {
      if (
        fill.opacity.toFixed(1) == 0.2 &&
        fill.color.b == 0.07058823853731155 &&
        fill.color.g == 0.07058823853731155 &&
        fill.color.r == 0.07058823853731155
      )
        return true;
    } else {
      if (
        fill.opacity.toFixed(1) == 0.5 &&
        fill.color.b == 0 &&
        fill.color.g == 0 &&
        fill.color.r == 0
      ) {
        return true;
      }
      if (
        fill.color.b == 0.2078431397676468 &&
        fill.color.g == 0.2078431397676468 &&
        fill.color.r == 0.2078431397676468
      ) {
        return true;
      }
    }
  }
  return false;
}

export function checkFills(node, errors, configuration) {
  if (typeof node.boundVariables.fills !== "undefined") {
    let check = true;
    node.boundVariables.fills.forEach(variable => {
      if (!theme.theme.includes(variable.id)) {
        check = false;
      }
    });
    if (check) {
      return;
    } else {
      return errors.push(
        createErrorObject(
          node,
          "fill",
          "Wrong fill variable",
          "Replace fill variable"
        )
      );
    }
  }
  if (
    (node.fills.length && node.visible === true) ||
    typeof node.fills === "symbol"
  ) {
    let nodeFills = node.fills;
    let fillStyleId = node.fillStyleId;

    // Checks if there is more a mixed value
    if (typeof nodeFills === "symbol") {
      return errors.push(
        createErrorObject(node, "fill", "Missing fill style", "Mixed values")
      );
    }

    // Not sure what this means
    if (typeof fillStyleId === "symbol") {
      return errors.push(
        createErrorObject(node, "fill", "Missing fill style", "Mixed values")
      );
    }

    if (
      node.fills[0].type !== "IMAGE" &&
      node.fills[0].type !== "VIDEO" &&
      node.fills[0].visible === true
    ) {
      // We may need an array to loop through fill types.
      return errors.push(
        createErrorObject(
          node,
          "fill",
          "Missing fill style",
          determineFill(node.fills)
        )
      );
    } else if (
      node.fills.length &&
      overlayCheck(node.fills[0], configuration)
    ) {
      return;
    } else {
      return;
    }
  }
}

export function checkStrokes(node, errors, configuration) {
  if (node.strokes.length) {
    if (typeof node.boundVariables.strokes !== "undefined") {
      return;
    }

    if (node.strokeStyleId === "" && node.visible === true) {
      let strokeObject = {
        strokeWeight: "",
        strokeAlign: "",
        strokeFills: []
      };

      // With the update to stroke alignment, sometimes
      // strokes can be symhols (figma.mixed)
      let strokeWeight = node.strokeWeight;

      // Check for a mixed stroke weight and return a generic error
      if (typeof strokeWeight === "symbol") {
        return errors.push(
          createErrorObject(
            node,
            "stroke",
            "Missing stroke style",
            "Mixed sizes or alignment"
          )
        );
      }

      strokeObject.strokeWeight = node.strokeWeight;
      strokeObject.strokeAlign = node.strokeAlign;
      strokeObject.strokeFills = determineFill(node.strokes);

      let currentStyle = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;

      return errors.push(
        createErrorObject(node, "stroke", "Missing stroke style", currentStyle)
      );
    } else {
      return;
    }
  }
}

export function checkType(node, errors, configuration) {
  if (
    node.textStyleId === "" &&
    node.visible === true &&
    node.fontName.family !== "Font Awesome 6 Pro"
  ) {
    let textObject = {
      font: "",
      fontStyle: "",
      fontSize: "",
      lineHeight: {}
    };

    let fontStyle = node.fontName;
    let fontSize = node.fontName;

    if (typeof fontSize === "symbol") {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Missing text style",
          "Mixed sizes or families"
        )
      );
    }

    if (typeof fontStyle === "symbol") {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Missing text style",
          "Mixed sizes or families"
        )
      );
    }

    textObject.font = node.fontName.family;
    textObject.fontStyle = node.fontName.style;
    textObject.fontSize = node.fontSize;

    // Line height can be "auto" or a pixel value
    if (node.lineHeight.value !== undefined) {
      textObject.lineHeight = node.lineHeight.value;
    } else {
      textObject.lineHeight = "Auto";
    }

    let currentStyle = `${textObject.font} ${textObject.fontStyle} / ${textObject.fontSize} (${textObject.lineHeight} line-height)`;

    return errors.push(
      createErrorObject(node, "text", "Missing text style", currentStyle)
    );
  } else if (configuration == "default") {
    if (typeof node.fontName === "symbol") {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Mixed text style",
          "Mixed families (potentially can ignore)"
        )
      );
    }
    if (
      node.fontName.family != "Libre Franklin" &&
      node.fontName.family != "Font Awesome 6 Pro"
    ) {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Invalid text style",
          node.fontName.family
        )
      );
    }
  } else if (configuration == "docv") {
    if (typeof node.fontName === "symbol") {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Mixed text style",
          "Mixed families (potentially can ignore)"
        )
      );
    }
  } else {
    return;
  }
}

// Utility functions for color conversion.
const convertColor = color => {
  const colorObj = color;
  const figmaColor = {};

  Object.entries(colorObj).forEach(cf => {
    const [key, value] = cf;

    if (["r", "g", "b"].includes(key)) {
      figmaColor[key] = (255 * (value as number)).toFixed(0);
    }
    if (key === "a") {
      figmaColor[key] = value;
    }
  });
  return figmaColor;
};

function RGBToHex(r, g, b) {
  r = Number(r).toString(16);
  g = Number(g).toString(16);
  b = Number(b).toString(16);

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;

  return "#" + r + g + b;
}
