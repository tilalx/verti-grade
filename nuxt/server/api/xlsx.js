import ExcelJS from 'exceljs';
import { serverSupabaseClient } from '#supabase/server';

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

    const { data: climbingRoutes, error } = await supabase
      .from('climbingroutes')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Climbing Routes');

    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Schwierigkeit', key: 'difficulty', width: 20 },
      { header: 'Sign', key: 'difficulty_sign', width: 10},
      { header: 'Ort', key: 'location', width: 20 },
      { header: 'Typ', key: 'type', width: 15 },
      { header: 'Kommentar', key: 'comment', width: 30 },
      { header: 'Schrauber', key: 'creator', width: 30 },
      { header: 'Schraubdatum', key: 'screw_date', width: 15 },
    ];

    // Add rows
    climbingRoutes.forEach(cr => {
      worksheet.addRow({
        name: cr.name,
        difficulty: cr.difficulty,
        difficulty_sign: cr.difficulty_sign === '+' ? true : difficulty_sign.value === '-' ? false : null,
        location: cr.location,
        type: cr.type,
        comment: cr.comment,
        creator: cr.creator.join(', '),
        screw_date: new Date(cr.screw_date).toLocaleDateString('de-DE'),
      });
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="climbing-routes-${Date.now()}.xlsx"`);
    res.end(buffer);

  } catch (error) {
    console.error(error);
    createError({ statusCode: 500, statusMessage: 'Server error' });
  }
});
