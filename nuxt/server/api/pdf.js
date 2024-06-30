import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { serverSupabaseClient } from "#supabase/server";

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  const res = event.node.res;
  try {
    const paramId = getQuery(event);

    const ids = paramId?.id ? paramId.id.split(",") : [];
    if (ids.length === 0) {
      return createError({
        statusCode: 400,
        statusMessage: "No IDs provided.",
      });
    }

    const { data: imageUrl} = supabase
    .storage
    .from("img")
    .getPublicUrl('public/logo.png');
    
    const logoBuffer = await fetch(imageUrl.publicUrl).then((res) => res.arrayBuffer());

    const doc = new PDFDocument({ size: [595.28, 841.89] });
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    let entryCount = 0;
    

    for (let id of ids) {
      const { data: climbingRoute, error } = await supabase
        .from("climbingroutes")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !climbingRoute) {
        continue; // Skip if not found
      }
      // Every 8 entries, add a new page
      if (entryCount % 8 === 0 && entryCount > 0) {
        doc.addPage();
      }

      const x = entryCount % 2 === 0 ? 25 : 310; // Position for 2 columns
      const y = (Math.floor(entryCount / 2) % 4) * 180 + 40; // Position for 4 rows

      // Draw a border around the entry
      doc.rect(x - 10, y - 10, 280, 170).stroke();

      // add color
      doc.circle(x + 80, y + 5, 10).fill(climbingRoute.color);

      //set text color black
      doc.fillColor("black");

      // Set text positions
      const textOptions = { align: "left", width: 200 };
      doc.text(
        climbingRoute.name,
        calculateStartX(x + 80, climbingRoute.name, doc),
        y + 25,
        textOptions
      );
      doc
        .fontSize(25)
        .text(
          climbingRoute.difficulty + climbingRoute.difficultySign,
          x + 70,
          y + 45,
          textOptions
        );
      doc.text(
        climbingRoute.comment,
        calculateStartX(x + 80, climbingRoute.comment, doc),
        y + 75,
        textOptions
      );

      // Search for first and last name based on creatorId
      const creators = climbingRoute.creators || [];
      if (Array.isArray(creators)) {
        doc
          .fontSize(8)
          .text(
            creators.join(" / "),
            calculateStartX(x + 80, creators.join(" / "), doc),
            y + 120,
            textOptions
          );
      }

      const date = new Date(climbingRoute.screw_date);
      const screw_date = date.toLocaleDateString("DE-de");
      doc
        .fontSize(8)
        .text(
          screw_date,
          calculateStartX(x + 80, screw_date, doc),
          y + 140,
          textOptions
        );

      // QR code positioning and scaling
      const qrX = x + 155; // X position for QR code (to the right of the text)
      const qrY = y - 15; // Y position for QR code
      const qrSize = 120; // Size of the QR code, adjust as necessary

      // Generate QR code with the server URL
      const serverUrl =
        process.env.SERVER_URL + `/route?id=${id}` ||
        `http://localhost:8080/route?id=${id}`;
      const qrCodeBuffer = await QRCode.toBuffer(serverUrl, {
        color: {
          light: "#0000", // Transparent background
        },
      });
      doc.image(qrCodeBuffer, qrX, qrY, { fit: [qrSize, qrSize] });

      doc.image(logoBuffer, {
        fit: [100, 100],
        y: y + 100,
        x: x + 165,
      });

      entryCount++;
    }

    doc.end();
  } catch (error) {
    console.error(error);
    createError({ statusCode: 500, statusMessage: "Server error" });
  }
});

// Function to calculate the starting X-coordinate for centered text
function calculateStartX(desiredXCenter, text, doc) {
  if (text !== null) {
    // Choose a font and font size for measuring
    doc.font("Helvetica").fontSize(12);

    // Measure the width of the text
    const textWidth = doc.widthOfString(text);
    // Calculate and return the starting X position for the centered text
    return desiredXCenter - textWidth / 2;
  }
  return 0;
}
