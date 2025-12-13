const URL = "https://script.google.com/macros/s/AKfycbzkKOICVVi7Z88Ru2-LuaIhUEFUV7c3IMDf0yMbnYKK4iQzIU6OgwUd39iN0Rwn2q0VKQ/exec";

const btn = document.getElementById("btnSubmit");
const statusText = document.getElementById("formStatus");

const btnTable = document.getElementById("btnTable");
const btnCalendar = document.getElementById("btnCalendar");
const tableView = document.getElementById("tableView");
const calendarView = document.getElementById("calendarView");

let cachedData = [];

/* ================= LOAD DATA ================= */
async function loadTable(){
  const res = await fetch(URL);
  const data = await res.json();
  cachedData = data;

  const thead = document.querySelector("#data-table thead");
  const tbody = document.querySelector("#data-table tbody");

  const headers = Object.keys(data[0] || {});
  thead.innerHTML =
    "<tr><th>No</th>" +
    headers.map(h=>`<th>${h}</th>`).join("") +
    "</tr>";

  tbody.innerHTML = data.reverse().map((row,i)=>`
    <tr>
      <td>${i+1}</td>
      ${headers.map(h=>`<td>${row[h]||""}</td>`).join("")}
    </tr>
  `).join("");
}

loadTable();

/* ================= SUBMIT FORM ================= */
document.getElementById("dataForm").addEventListener("submit", async e=>{
  e.preventDefault();
  if(btn.disabled) return;

  const formData = Object.fromEntries(new FormData(e.target).entries());

  btn.disabled = true;
  btn.innerText = "⏳ Mengirim...";
  statusText.innerHTML = "Sedang mengirim data...";
  statusText.scrollIntoView({behavior:"smooth"});

  try{
    const res = await fetch(URL,{
      method:"POST",
      body: JSON.stringify(formData)
    });
    const result = await res.json();

    if(result.status === "success"){
      statusText.innerHTML = "✅ Data berhasil dikirim";
      e.target.reset();
      loadTable();
    }else{
      statusText.innerHTML = "⚠️ " + result.message;
    }
  }catch{
    statusText.innerHTML = "❌ Gagal mengirim data";
  }

  btn.disabled = false;
  btn.innerText = "Simpan Data";
});

/* ================= TOGGLE VIEW ================= */
btnTable.onclick = ()=>{
  tableView.style.display = "block";
  calendarView.style.display = "none";
  btnTable.classList.add("active");
  btnCalendar.classList.remove("active");
};

btnCalendar.onclick = ()=>{
  tableView.style.display = "none";
  calendarView.style.display = "block";
  btnCalendar.classList.add("active");
  btnTable.classList.remove("active");
  renderCalendar();
};

/* ================= CALENDAR VIEW ================= */
function renderCalendar(){
  const cal = document.getElementById("calendar");

  if(!cachedData.length){
    cal.innerHTML = "<p>Belum ada data</p>";
    return;
  }

  cal.innerHTML = cachedData.map(d=>`
    <div>
      <strong>${d["Tanggal"]} ${d["Bulan"]}</strong><br>
      🏢 ${d["Ruangan yang Dipinjam"]}<br>
      ⏰ ${d["Pukul (WIB)"]}<br>
      📌 ${d["Kegiatan"]}
    </div>
  `).join("");
}
