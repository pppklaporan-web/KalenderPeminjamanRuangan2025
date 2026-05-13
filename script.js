const URL = "https://script.google.com/macros/s/AKfycbzkKOICVVi7Z88Ru2-LuaIhUEFUV7c3IMDf0yMbnYKK4iQzIU6OgwUd39iN0Rwn2q0VKQ/exec";

let cachedData = [];
let isBlocked = false;

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("dataForm");
  const btn = document.getElementById("btnSubmit");
  const status = document.getElementById("formStatus");

  async function loadData(){
    const res = await fetch(URL);
    cachedData = await res.json();
  }

  loadData();

  form?.addEventListener("input", () => {
    const formData = Object.fromEntries(new FormData(form));

    const bentrok = cekBentrok(formData);

    if(bentrok){
      isBlocked = true;
      btn.disabled = true;
      status.innerHTML = "❌ Bentrok jadwal!";
      status.style.color = "red";
    } else {
      isBlocked = false;
      btn.disabled = false;
      status.innerHTML = "✅ Aman";
      status.style.color = "green";
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if(isBlocked){
      alert("Tidak bisa submit, jadwal bentrok!");
      return;
    }

    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form));

    await fetch(URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    alert("Berhasil disimpan");
    form.reset();
    btn.disabled = false;
  });

});

function cekBentrok(data){
  return cachedData.find(d =>
    d["Tanggal"] === data.Tanggal &&
    d["Bulan"] === data.Bulan &&
    d["Ruangan yang Dipinjam"] === data["Ruangan yang Dipinjam"]
  );
}
