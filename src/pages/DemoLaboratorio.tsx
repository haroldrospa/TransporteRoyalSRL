import Layout from '@/components/layout/Layout';
import DemoLaboratorioContent from '@/components/demo-laboratorio/DemoLaboratorioContent';
import { useAuth } from '@/contexts/AuthContext';

const DemoLaboratorio = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <DemoLaboratorioContent />
    </Layout>
  );
};

export default DemoLaboratorio;
