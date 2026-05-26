import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ProjectScreen from "@/components/project/ProjectScreen";
import { useAuth } from "@/hooks/useAuth";

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) return null;

  return <ProjectScreen onBack={() => navigate("/")} projectId={id ?? null} />;
};

export default Project;
