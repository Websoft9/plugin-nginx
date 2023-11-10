import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import cockpit from 'cockpit';
import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import './App.css';

function App() {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [iframeKey, setIframeKey] = useState(Math.random());
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const baseURL = `${window.location.protocol}//${window.location.hostname}`;

  const getToken = async () => {
    try {
      var script = "docker exec -i websoft9-apphub apphub getconfig --section nginx_proxy_manager";
      let content = (await cockpit.spawn(["/bin/bash", "-c", script], { superuser: "try" })).trim();
      content = JSON.parse(content);

      const userName = content.user_name
      const userPwd = content.user_pwd
      const nikeName = content.nike_name

      if (!userName || !userPwd || !nikeName) {
        setShowAlert(true);
        setAlertMessage("Nginx Username or Password is empty.");
        return;
      }

      const authResponse = await axios.post(baseURL + "/w9proxy/api/tokens", {
        identity: userName,
        secret: userPwd
      });
      if (authResponse.status === 200) {
        var tokens = authResponse.data.token;
        document.cookie = "nginx_tokens=" + tokens + "; path=/";
        document.cookie = "nginx_nikeName=" + nikeName + "; path=/";
        setTokenLoaded(true);
      } else {
        setShowAlert(true);
        setAlertMessage("Auth Nginxproxymanager Error.")
      }
    }
    catch (error) {
      setShowAlert(true);
      const errorText = [error.problem, error.reason, error.message]
        .filter(item => typeof item === 'string')
        .join(' ');

      if (errorText.includes("permission denied")) {
        setAlertMessage("Permission denied.");
      }
      else {
        setAlertMessage(errorText || "Login Nginxproxymanager Error.");
      }
    }
  }

  const autoLogin = async () => {
    try {
      await getToken();

      setIframeKey(Math.random());
      var newHash = window.location.hash;
      if (newHash.includes("/w9proxy/nginx")) {
        var index = newHash.indexOf("#");
        if (index > -1) {
          var content = newHash.slice(index + 1);
          setIframeKey(Math.random());
          setIframeSrc(baseURL + content);
        }
      }
      else {
        setIframeSrc(baseURL + "/w9proxy/");
      }
    }
    catch (error) {
      setShowAlert(true);
      setAlertMessage("Call Nginxproxymanager Page Error." + error)
    }
  }

  const handleHashChange = () => {
    var newHash = window.location.hash;
    if (newHash.includes("/w9proxy/nginx")) {
      var index = newHash.indexOf("#");
      if (index > -1) {
        var content = newHash.slice(index + 1);
        setIframeKey(Math.random());
        setIframeSrc(baseURL + content);
      }
    }
  }

  useEffect(async () => {
    await autoLogin();

    window.addEventListener("hashchange", handleHashChange, true);
    return () => {
      window.removeEventListener("hashchange", handleHashChange, true);
    };
  }, []);

  return (
    <>
      {
        iframeKey && iframeSrc && tokenLoaded ? (
          <div className='myNginx' key='container'>
            <iframe key={iframeKey} title='nginxproxymanager' src={iframeSrc} />
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center m-5" style={{ flexDirection: "column" }}>
            <Spinner animation="border" variant="secondary" className='mb-5' />
            {showAlert && <Alert variant="danger" className="my-2">
              {alertMessage}
            </Alert>}
          </div>
        )
      }
    </>
  );
}

export default App;