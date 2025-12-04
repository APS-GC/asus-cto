import { callSSOValidation } from "../../scripts/api-service.js";
import { getCookie,deleteCookie } from "../../scripts/cookie.js";
export async function checkLoginStatus() {
  if (!checkCookie())return;
  try {
    const result = await callSSOValidation("check",aTicket);
    if (!result.ok) {
      const code = result.data.ResultCode;
      if (code === "11") {
        //aticket expired
        clearLogin();
      }
    } else {
      localStorage.setItem("isLoggedIn", "true");
    }
  } catch (error) {
    console.error(error);
  }
}

export async function getUserData() {
  if (!checkCookie())return;
  try {
    const result = await callSSOValidation("user",aTicket);
    if (!result.ok) {
      const code = result.data.ResultCode;
      if (code === "11") {
        //aticket expired
        clearLogin();
      }
    } else {
      const user = result.data.ReturnData.DocumentElement.Member;
      const name = user.nick_name;
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userName", name);
    }
  } catch (error) {
    console.error(error);
  }
}

export async function logout() {
  if (!checkCookie())return;
  try {
    const result = await callSSOValidation("logout",aTicket);
    if (result.ok) {
      clearLogin();
    }
  } catch (error) {
    console.error(error);
  }
}

function clearLogin() {
  deleteCookie("aTicket");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userName");
}

function checkCookie(){
  const aTicket = getCookie("aTicket");
  if (!aTicket) clearLogin();
  return aTicket;
}