const BASE_URL = "https://doctor-backend-wlb3.onrender.com";

// 🔍 EMAIL VALIDATION
function isValidEmail(email){
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function safeFetch(url, options){
  for(let i = 0; i < 3; i++){
    try{
      const res = await fetch(url, options);

      if(res.ok){
        return res;
      }

    } catch(err){
      console.log("Retrying...");
    }

    // wait 2 seconds
    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error("Server not responding");
}

// ================= SIGNUP =================
async function signup(){
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if(!name || !email || !password){
    alert("All fields required");
    return;
  }

  if(!isValidEmail(email)){
    alert("Invalid email");
    return;
  }

  // ✅ ADD THIS (BUTTON LOADING START)
  const btn = document.getElementById("signupBtn");
  btn.innerText = "Signing up...";
  btn.disabled = true;

  try{
    const res = await safeFetch(BASE_URL + "/signup", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({name,email,password,role})
    });

    const data = await res.json();

    if(res.ok){
      alert("Signup successful!");

      localStorage.setItem("user", JSON.stringify({name,email,role}));

      if(role === "admin"){
        window.location.href = "admin.html";
      }
      else if(role === "doctor"){
        window.location.href = "doctor.html";
      }
      else{
        window.location.href = "patient.html";
      }

    } else {
      alert(data.message);
    }

  } catch(err){
    console.log(err);
    alert("Server is waking up... please try again");

  } finally {
    // ✅ ADD THIS (BUTTON RESET)
    btn.innerText = "Signup";
    btn.disabled = false;
  }
}

// ================= LOGIN =================
async function login(){
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if(!email || !password){
    alert("Enter email & password");
    return;
  }

  // ✅ ADD THIS HERE (START)
  const btn = document.getElementById("loginBtn");;
  btn.innerText = "Logging in...";
  btn.disabled = true;
  // ✅ ADD THIS HERE (END)

  try{
    const res = await safeFetch(BASE_URL + "/login", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({email,password})
    });

    if(res.ok){
      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));

      if(user.role === "admin"){
        window.location.href = "admin.html";
      }
      else if(user.role === "doctor"){
        window.location.href = "doctor.html";
      }
      else{
        window.location.href = "patient.html";
      }

    } else {
      alert("Invalid login");
    }

  } catch(err){
    console.log(err);
    alert("Server is waking up... please try again");

  } finally {
    // ✅ ADD THIS (VERY IMPORTANT)
    btn.innerText = "Login";
    btn.disabled = false;
  }
}