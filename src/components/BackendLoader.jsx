import { useEffect, useState } from "react";
import LinearProgress from '@mui/material/LinearProgress';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${BASE_URL}/health`;

export default function BackendLoader({ children }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let interval;

        const checkBackend = async () => {
            try {
                const res = await fetch(API_URL);
                if (res.ok) {
                    setReady(true);
                    clearInterval(interval);
                }
            } catch (err) {
                console.log("Backend waking up...");
            }
        };

        checkBackend(); // first attempt immediately
        interval = setInterval(checkBackend, 5000); // retry every 5s

        return () => clearInterval(interval);
    }, []);

    if (!ready) {
        return (
            <div style={{ textAlign: "center", marginTop: "40vh" }}>
                <h2>Getting things ready for you...</h2>
                <p>This may take a minute.</p>
                <LinearProgress sx={{ width: "20%", mx: "auto", mt: 4 }} />
            </div>
        );
    }

    return children;
}