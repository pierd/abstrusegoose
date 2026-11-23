import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { numericStripIds } from "../strips";

function randomStripId() {
  return numericStripIds[Math.floor(Math.random() * numericStripIds.length)];
}

// /random redirects to a random strip. Being a real route lets the "Random"
// link be a normal <Link> (keyboard accessible, can be opened in a new tab).
function RandomStrip() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate(`/${randomStripId()}`, { replace: true });
  }, [navigate]);
  return null;
}

export default RandomStrip;
