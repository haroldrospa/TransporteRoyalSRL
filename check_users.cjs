const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hprhedrdondfunnuhvag.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcmhlZHJkb25kZnVubnVodmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTY0ODcsImV4cCI6MjA1ODU3MjQ4N30.65TIp89psr_Cl_MyvUbutsfYRtLI9umPDFiVf1FgQRM'
);

async function check() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('email, nombre, apellido, puesto, laboratorio, nivel, camion');
  
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} users.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
