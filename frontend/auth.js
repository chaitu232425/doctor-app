const BASE_URL = "https://doctor-backend-wlb3.onrender.com";

// 🔍 EMAIL VALIDATION
function isValidEmail(email){
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
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

  try{
    const res = await fetch(BASE_URL + "/signup", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({name,email,password,role})
    });

    const data = await res.json();

    if(res.ok){
      alert("Signup successful!");

      localStorage.setItem("user", JSON.stringify({name,email,role}));

      // ✅ CORRECT REDIRECT
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
    alert("Server error");
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

  try{
    const res = await fetch(BASE_URL + "/login", {
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
    alert("Server error");
  }
}