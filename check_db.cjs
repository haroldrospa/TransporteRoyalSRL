const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hprhedrdondfunnuhvag.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcmhlZHJkb25kZnVubnVodmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTY0ODcsImV4cCI6MjA1ODU3MjQ4N30.65TIp89psr_Cl_MyvUbutsfYRtLI9umPDFiVf1FgQRM'
);

async function check() {
  const { data, error } = await supabase
    .from('conduces')
    .select('numero_conduce, imagen')
    .eq('numero_conduce', '80909923');
  
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} records.`);
    if (data.length > 0) {
      console.log(`Image length: ${data[0].imagen ? data[0].imagen.length : 'NULL'}`);
      console.log(`Image starts with: ${data[0].imagen ? data[0].imagen.substring(0, 30) : 'NULL'}`);
    }
  }
}

check();
