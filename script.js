const URL = "https://script.google.com/macros/s/AKfycbzkKOICVVi7Z88Ru2-LuaIhUEFUV7c3IMDf0yMbnYKK4iQzIU6OgwUd39iN0Rwn2q0VKQ/exec";

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("btnSubmit");
  const statusText = document.getElementById("formStatus");
  const form = document.getElementById("dataForm");
  const filterBulan = document.getElementById("filterBulan");

  let cachedData = [];

  const SEMUA_RUANGAN = [
    "Marapi","Kerinci","Singgalang","Tandikek","Ruang Garda SE2026","Ruang Pengolahan"
  ];

  const BULAN_MAP = {
    Januari: 0, Februari: 1, Maret: 2, April: 3,
    Mei: 4, Juni: 5, Juli: 6, Agustus: 7,
    September: 8, Oktober: 9, November: 10, Desember: 11
  };

  /* ================= LOAD DATA ================= */
  async function loadTable(){
    try {
      const res = await fetch(URL);
      const data = await res.json();
      cachedData = data;

      // Tentukan bulan yang dipilih
      const selectedMonth = filterBulan.value || "current";
      let dataTampil;

      if(selectedMonth === "current") {
        dataTampil = filterBulanBerjalan(data);
      } else {
        dataTampil = data.filter(d => d["Bulan"] === selectedMonth);
      }

      renderTable(dataTampil);
    } catch(err) {
      console.error("Gagal load data:", err);
    }
  }

  loadTable();

  /* ================= FILTER BULAN OTOMATIS ================ */
  function filterBulanBerjalan(data){
    const bulanNow = new Date().getMonth();
    return data.filter(d => BULAN_MAP[d["Bulan"]] === bulanNow);
  }

  /* ================= FILTER DROPDOWN ================= */
  filterBulan?.addEventListener("change", ()=>{
    loadTable();
  });

  /* ================= RENDER TABLE ================= */
  function renderTable(data){
    const thead = document.querySelector("#data-table thead");
    const tbody = document.querySelector("#data-table tbody");

    if(!data.length){
      thead.innerHTML = "";
      tbody.innerHTML = "<tr><td colspan='99'>Tidak ada data</td></tr>";
      return;
    }

    const headers = Object.keys(data[0]).filter(h => h !== "ID");

    thead.innerHTML =
      "<tr><th>No</th>" +
      headers.filter(h => h !== "WARNING").map(h=>`<th>${h}</th>`).join("") +
      "<th>WARNING</th><th>Aksi</th></tr>";

    tbody.innerHTML = [...data].reverse().map((row,i)=>{
      const bentrokData = cariBentrok(row, cachedData);
      const bentrok = !!bentrokData;

      const headersTanpaWarning = headers.filter(h => h !== "WARNING");

      return `
        <tr class="${bentrok ? "bentrok" : ""}">
          <td>${i+1}</td>
          ${headersTanpaWarning.map(h=>`<td>${row[h] || ""}</td>`).join("")}
          <td class="warning-cell">
            ${bentrok ? `⚠️ Bentrok jam dengan ${bentrokData["Pukul (WIB)"]}` : ""}
          </td>
          <td>
            <button onclick="hapusData('${row.ID}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  /* ================= SUBMIT FORM ================= */
  form.addEventListener("submit", async e=>{
    e.preventDefault();
    if(btn.disabled) return;

    const formData = Object.fromEntries(new FormData(form).entries());

    btn.disabled = true;
    btn.innerText = "⏳ Mengirim...";
    statusText.innerHTML = "Sedang mengirim data...";

    try{
      const res = await fetch(URL,{
        method:"POST",
        body: JSON.stringify({ action: "add", ...formData })
      });

      const result = await res.json();

      if(result.status === "success"){
        statusText.innerHTML = "✅ Data berhasil disimpan";
        statusText.style.color = "green";
        form.reset();
        loadTable();
      }else{
        statusText.innerHTML = "⚠️ " + result.message;
        statusText.style.color = "red";
      }
    }catch(err){
      statusText.innerHTML = "❌ Gagal mengirim data";
      statusText.style.color = "red";
      console.error(err);
    }

    btn.disabled = false;
    btn.innerText = "Simpan Data";
  });

  /* ================= REKOMENDASI RUANGAN ================= */
  function cekRekomendasiRuangan(tanggal, bulan, ruanganDipilih){
    if(!tanggal || !bulan || !ruanganDipilih) return null;

    const terpakai = cachedData
      .filter(d => d["Tanggal"] === tanggal && d["Bulan"] === bulan)
      .map(d => d["Ruangan yang Dipinjam"]);

    if(!terpakai.includes(ruanganDipilih)){
      return { status:"aman", pesan:"✅ Ruangan masih tersedia" };
    }

    const rekom = SEMUA_RUANGAN.filter(r => !terpakai.includes(r));
    return {
      status:"bentrok",
      pesan:`❌ Ruangan dipakai. Rekomendasi: ${rekom.join(", ")}`
    };
  }

  const inputTanggal = document.querySelector('[name="Tanggal"]');
  const inputBulan = document.querySelector('[name="Bulan"]');
  const inputRuangan = document.querySelector('[name="Ruangan yang Dipinjam"]');

  inputRuangan?.addEventListener("change", ()=>{
    const hasil = cekRekomendasiRuangan(
      inputTanggal.value,
      inputBulan.value,
      inputRuangan.value
    );
    if(!hasil) return;

    statusText.innerHTML = hasil.pesan;
    statusText.style.color = hasil.status === "aman" ? "green" : "red";
  });

  /* ================= BENTROK ================= */
  function cariBentrok(row, semuaData) {
    const jamA = parseJamRange(row["Pukul (WIB)"]);
    if (!jamA) return null;

    for (const d of semuaData) {
      if (d === row) continue;

      if (
        d["Tanggal"] === row["Tanggal"] &&
        d["Bulan"] === row["Bulan"] &&
        d["Ruangan yang Dipinjam"] === row["Ruangan yang Dipinjam"]
      ) {
        const jamB = parseJamRange(d["Pukul (WIB)"]);
        if (!jamB) continue;

        const overlap = jamA.start < jamB.end && jamB.start < jamA.end;
        if (overlap) return d;
      }
    }
    return null;
  }

  /* ================= HAPUS DATA ================= */
  window.hapusData = async function(id){
    if(!id) return alert("ID tidak valid");
    if(!confirm("Yakin ingin menghapus data ini?")) return;

    try{
      const res = await fetch(URL,{
        method: "POST",
        body: JSON.stringify({ action: "delete", id: id })
      });

      const result = await res.json();

      if(result.status === "success"){
        alert("✅ Data berhasil dihapus");
        loadTable();
      }else{
        alert("⚠️ Data tidak ditemukan");
      }
    }catch(err){
      alert("❌ Error koneksi");
      console.error(err);
    }
  };

  function parseJamRange(text) {
    if (!text) return null;

    const parts = text.replace(/\s/g, "").split("-");
    if (parts.length !== 2) return null;

    const toMinutes = (t) => {
      const [h, m] = t.split(".").map(Number);
      return h * 60 + m;
    };

    return { start: toMinutes(parts[0]), end: toMinutes(parts[1]) };
  }

});
