const BASE_URL = "https://doctor-backend-wlb3.onrender.com";

async function waitForBackend(){
  const loader = document.getElementById("loader");

  while(true){
    try{
      const res = await fetch(BASE_URL + "/ping");

      if(res.ok){
        loader.style.display = "none";
        break;
      }

    } catch(err){
      console.log("Waiting for backend...");
    }

    await new Promise(r => setTimeout(r, 2000));
  }
}

waitForBackend();

// 🌙 DARK MODE
function toggleDarkMode(){
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme",
    document.body.classList.contains("dark-mode") ? "dark" : "light");
}

function applySavedTheme(){
  if(localStorage.getItem("theme")==="dark"){
    document.body.classList.add("dark-mode");
  }
}

// 🔐 LOGOUT
function logout(){
  localStorage.removeItem("user");

  // ✅ CLEAR INPUT FIELDS (IMPORTANT FIX)
  document.querySelectorAll("input").forEach(i => i.value = "");

  window.location.href = "index.html";
}

// 👤 GET USER
function getUser(){
  return JSON.parse(localStorage.getItem("user"));
}

/* ================= ADMIN ================= */

if(window.location.pathname.includes("admin")){

  const user = getUser();

  if(!user || user.role !== "admin"){
    alert("Access denied");
    window.location.href = "index.html";
  }

  document.getElementById("doctorForm").addEventListener("submit", async e=>{
    e.preventDefault();

    const name = document.getElementById("name").value;
    const hospital = document.getElementById("hospital").value;
    const specialization = document.getElementById("specialization").value;

    const res = await fetch("https://doctor-backend-wlb3.onrender.com/add-doctor", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        name,hospital,specialization,
        role: user.role
      })
    });

    const data = await res.json();

    if(res.ok){
      alert("Doctor added");
      e.target.reset();
      loadDoctors();
    } else {
      alert(data.message);
    }
  });

  async function loadDoctors(){
    const res = await fetch("https://doctor-backend-wlb3.onrender.com/get-doctors");
    const doctors = await res.json();

    const list = document.getElementById("doctorList");
    list.innerHTML = "";

    doctors.forEach(d=>{
      list.innerHTML += `
        <div class="doctor-card">
          <h3>${d.name}</h3>
          <p>${d.hospital}</p>
          <span>${d.specialization}</span>

          <button onclick="deleteDoctor(
            '${d.name}',
            '${d.hospital}',
            '${d.specialization}'
          )">Delete</button>
        </div>
      `;
    });
  }

  window.deleteDoctor = async function(name,hospital,specialization){
    if(!confirm("Delete doctor?")) return;

    await fetch("https://doctor-backend-wlb3.onrender.com/delete-doctor", {
      method:"DELETE",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        name,hospital,specialization,
        role: user.role
      })
    });

    loadDoctors();
  }

  loadDoctors();
}

/* ================= DOCTOR ================= */

if(window.location.pathname.includes("doctor")){

  const user = getUser();

  if(!user || user.role !== "doctor"){
    window.location.href = "index.html";
  }

  async function loadAppointments(){
    const res = await fetch("https://doctor-backend-wlb3.onrender.com/doctor-appointments", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({doctorName:user.name})
    });

    const data = await res.json();

    const list = document.getElementById("appointmentList");
    list.innerHTML = "";

    data.forEach(a=>{

      let status = a.status || "PENDING";
      let buttons = "";

      // 🟡 PENDING
      if(status === "PENDING"){
        buttons = `
          <button onclick="accept('${a.patient}')">Accept</button>
          <button onclick="reject('${a.patient}')">Reject</button>
        `;
      }

      // 🟢 ACCEPTED → show COMPLETE button
      if(status === "ACCEPTED"){
        buttons = `
          <p style="color:green;">Accepted (${a.time})</p>
          <button onclick="complete('${a.patient}')">Checkup Completed</button>
        `;
      }

      // 🔴 REJECTED
      if(status === "REJECTED"){
        buttons = `<p style="color:red;">Rejected</p>`;
      }

      // 🔵 COMPLETED
      if(status === "COMPLETED"){
        buttons = `
          <p style="color:blue;">
            Completed on ${a.completedAt}
          </p>
        `;
      }

      list.innerHTML += `
        <div class="doctor-card">
          <strong>Patient: ${a.patient}</strong><br>
          Status: ${status}<br>
          ${a.time ? "Time: "+a.time : ""}<br><br>
          ${buttons}
        </div>
      `;
    });
  }

  window.accept = async function(patient){
    const time = prompt("Enter time (9AM - 5PM):");

    if(!time) return;

    await fetch("https://doctor-backend-wlb3.onrender.com/accept", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        patient,
        doctor:user.name,
        time
      })
    });

    loadAppointments();
  }

  window.reject = async function(patient){
    await fetch("https://doctor-backend-wlb3.onrender.com/reject", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        patient,
        doctor:user.name
      })
    });

    loadAppointments();
  }

  // 🆕 COMPLETE FUNCTION
  window.complete = async function(patient){

    const now = new Date().toLocaleString();

    await fetch("https://doctor-backend-wlb3.onrender.com/complete", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        patient,
        doctor:user.name,
        completedAt: now
      })
    });

    alert("Checkup completed");
    loadAppointments();
  }

  loadAppointments();
}
/* ================= PATIENT ================= */

if(window.location.pathname.includes("patient")){

  const user = getUser();

  if(!user || user.role !== "patient"){
    window.location.href = "index.html";
  }

  async function loadDoctors(){
    const res = await fetch("https://doctor-backend-wlb3.onrender.com/get-doctors");
    const doctors = await res.json();

    const list = document.getElementById("patientDoctorList");
    list.innerHTML = "";

    doctors.forEach(d=>{
      list.innerHTML += `
        <div class="doctor-card">
          <h3>${d.name}</h3>
          <p>${d.hospital}</p>
          <span>${d.specialization}</span><br><br>
          <button onclick="bookDoctor('${d.name}')">Request</button>
        </div>
      `;
    });
  }

  window.bookDoctor = async function(doctor){
    await fetch("https://doctor-backend-wlb3.onrender.com/book", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        patient: user.name,
        doctor
      })
    });

    alert("Request sent!");
    loadMyAppointments();
  }

  async function loadMyAppointments(){
    const res = await fetch("https://doctor-backend-wlb3.onrender.com/my-appointments", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({patient:user.name})
    });

    const data = await res.json();

    const list = document.getElementById("myAppointments");
    if(!list) return;

    list.innerHTML = "";

    data.forEach(a=>{

      let text = "";

      if(a.status === "PENDING" || !a.status){
        text = "Waiting for doctor approval";
      }

      if(a.status === "ACCEPTED"){
        text = `Accepted (Time: ${a.time})`;
      }

      if(a.status === "REJECTED"){
        text = "Rejected";
      }

      list.innerHTML += `
        <div class="doctor-card">
          Doctor: ${a.doctor}<br>
          Status: ${text}
        </div>
      `;
    });
  }

  loadDoctors();
  loadMyAppointments();
}