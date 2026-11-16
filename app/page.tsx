
"use client";

import { useEffect, useMemo, useState } from "react";

type Climate = {
  temperature: number;
  rainfall: number;
  radiation: number;
  months: { month: string; temperature: number; rainfall: number }[];
};

const crops = [
  { name: "Maíz", family: "Gramínea", water: "Media-alta", duration: "3–5 meses" },
  { name: "Frijol", family: "Leguminosa", water: "Media", duration: "2–4 meses" },
  { name: "Arroz", family: "Gramínea", water: "Alta", duration: "3–5 meses" },
  { name: "Maní", family: "Leguminosa", water: "Media", duration: "3–5 meses" },
  { name: "Yuca", family: "Raíz", water: "Media", duration: "8–12 meses" },
  { name: "Camote", family: "Raíz", water: "Media", duration: "4–6 meses" },
];

function average(values: number[]) {
  const valid = values.filter((v) => Number.isFinite(v) && v > -900);
  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : 0;
}

export default function Home() {
  const [climate, setClimate] = useState<Climate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("Tingo María, Huánuco, Perú");
  const [latitude, setLatitude] = useState("-9.295");
  const [longitude, setLongitude] = useState("-76.008");
  const [area, setArea] = useState("2");
  const [soil, setSoil] = useState("No determinado");
  const [currentCrop, setCurrentCrop] = useState("Maíz");
  const [priority, setPriority] = useState("Diversificar cultivos");
  const [scenarioA, setScenarioA] = useState(["Maíz", "Maíz", "Maíz"]);
  const [scenarioB, setScenarioB] = useState(["Maíz", "Frijol", "Maní"]);

  async function loadClimate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/climate?latitude=${latitude}&longitude=${longitude}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("NASA POWER no respondió correctamente");

      const result = await response.json();
      const parameters = result.properties.parameter;
      const temperature = parameters.T2M;
      const rainfall = parameters.PRECTOTCORR;
      const radiation = parameters.ALLSKY_SFC_SW_DWN;

      const months = Object.keys(temperature)
        .filter((key) => key.endsWith("01") || key.endsWith("02") ||
          key.endsWith("03") || key.endsWith("04") ||
          key.endsWith("05") || key.endsWith("06") ||
          key.endsWith("07") || key.endsWith("08") ||
          key.endsWith("09") || key.endsWith("10") ||
          key.endsWith("11") || key.endsWith("12"))
        .filter((key) => key.startsWith("2025"))
        .sort()
        .map((key) => ({
          month: key.slice(4, 6),
          temperature: temperature[key],
          rainfall: rainfall[key],
        }));

      const validMonths = Object.keys(temperature)
        .filter((key) => /^\d{4}(0[1-9]|1[0-2])$/.test(key));

      setClimate({
        temperature: average(validMonths.map((key) => temperature[key])),
        rainfall: average(validMonths.map((key) => rainfall[key])),
        radiation: average(validMonths.map((key) => radiation[key])),
        months,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al consultar NASA POWER");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClimate();
  }, []);

  const uniqueA = new Set(scenarioA).size;
  const uniqueB = new Set(scenarioB).size;

  const familyCountA = new Set(
    scenarioA.map((name) => crops.find((c) => c.name === name)?.family)
  ).size;
  const familyCountB = new Set(
    scenarioB.map((name) => crops.find((c) => c.name === name)?.family)
  ).size;

  const report = useMemo(() => {
    return `WADJE CROPSHIFT — INFORME DE EXPLORACIÓN

Ubicación: ${location}
Área: ${area} hectáreas
Suelo: ${soil}
Cultivo actual: ${currentCrop}
Prioridad: ${priority}

CONTEXTO AMBIENTAL NASA POWER
Periodo: 2020–2025
Temperatura media: ${climate?.temperature.toFixed(2) ?? "No disponible"} °C
Precipitación media diaria: ${climate?.rainfall.toFixed(2) ?? "No disponible"} mm/día
Radiación solar media: ${climate?.radiation.toFixed(2) ?? "No disponible"} MJ/m²/día

ESCENARIO A: ${scenarioA.join(" → ")}
Cultivos distintos: ${uniqueA}
Familias representadas: ${familyCountA}

ESCENARIO B: ${scenarioB.join(" → ")}
Cultivos distintos: ${uniqueB}
Familias representadas: ${familyCountB}

NOTA: Esta herramienta permite explorar secuencias de cultivos. La diversidad de cultivos y familias es descriptiva, no una puntuación de superioridad agronómica. La selección final requiere validar suelo, calendario local, agua, variedades, plagas y recomendaciones técnicas.

Fuente climática: NASA POWER API.
Ubicación de demostración: coordenadas de Tingo María.`;
  }, [location, area, soil, currentCrop, priority, climate, scenarioA, scenarioB, uniqueA, uniqueB, familyCountA, familyCountB]);

  function downloadReport() {
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "WADJE-CropShift-Report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function updateCrop(
    setter: (value: string[]) => void,
    current: string[],
    index: number,
    value: string
  ) {
    setter(current.map((crop, i) => (i === index ? value : crop)));
  }

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <main className="min-h-screen bg-[#09140f] text-white">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 lg:px-12">
        <div>
          <div className="text-2xl font-black tracking-[0.2em] text-lime-400">WADJE.</div>
          <p className="text-[10px] tracking-widest text-gray-400">AGRICULTURAL INTELLIGENCE</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full border border-lime-400/30 px-4 py-2 text-lime-300">NASA SPACE APPS 2026</span>
          <span className="hidden text-gray-400 sm:inline">TINGO MARÍA · PERÚ</span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <header className="mb-10">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-lime-400">EXPLORE · COMPARE · ADAPT</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Smarter crop rotations.
            <span className="block text-lime-400">A changing planet.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-gray-400">
            Explore agricultural adaptation strategies using NASA Earth
            observation data and crop information. Anywhere on Earth.
          </p>
        </header>

        <section className="mb-7 grid gap-5 md:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-[#11251b] p-6">
            <p className="text-xs text-gray-400">FARM PROFILE · DEMONSTRATION</p>
            <h2 className="mt-2 text-3xl font-bold">{location || "Ubicación seleccionada"}</h2>
            <p className="mt-1 text-sm text-gray-400">Coordenadas: {latitude}°, {longitude}°</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-300">
                Nombre de la ubicación
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3"
                  placeholder="Ciudad, país o parcela"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Latitud
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Longitud
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={loadClimate}
              className="mt-4 rounded-lg bg-lime-400 px-5 py-3 font-bold text-[#102016]"
            >
              Consultar esta ubicación
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-300">
                Área de parcela (ha)
                <input value={area} onChange={(e) => setArea(e.target.value)}
                  type="number" min="0.1" className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3 text-white" />
              </label>
              <label className="text-sm text-gray-300">
                Tipo de suelo
                <select value={soil} onChange={(e) => setSoil(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3">
                  <option>No determinado</option>
                  <option>Franco</option>
                  <option>Franco arenoso</option>
                  <option>Franco arcilloso</option>
                  <option>Arcilloso</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm text-gray-300">
              Cultivo actual
              <select value={currentCrop} onChange={(e) => setCurrentCrop(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3">
                {crops.map((crop) => <option key={crop.name}>{crop.name}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm text-gray-300">
              Prioridad agrícola
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3">
                <option>Diversificar cultivos</option>
                <option>Considerar necesidades de agua</option>
                <option>Alternar familias de cultivos</option>
                <option>Explorar opciones de adaptación climática</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11251b] p-6">
            <p className="text-xs text-gray-400">DATA PROVIDER</p>
            <h2 className="mt-3 text-3xl font-black">NASA</h2>
            <p className="text-sm font-semibold text-lime-400">POWER API</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Environmental and solar data for agricultural exploration.
            </p>
            <a className="mt-4 inline-block text-sm text-lime-300 underline"
              href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">
              NASA POWER ↗
            </a>
            <div className="mt-7 rounded-xl bg-[#1b3829] p-4">
              <p className="text-xs text-gray-400">DATA PERIOD</p>
              <p className="mt-1 text-xl font-bold">2020–2025</p>
              <p className="mt-1 text-xs text-gray-400">Monthly historical series</p>
            </div>
          </div>
        </section>

        <section className="mb-7 rounded-2xl border border-white/10 bg-[#11251b] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-lime-400">01 / EARTH INTELLIGENCE</p>
              <h2 className="mt-2 text-2xl font-bold">Environmental conditions</h2>
              <p className="mt-1 text-sm text-gray-400">NASA POWER · {location} · {latitude}, {longitude} · 2020–2025</p>
            </div>
            <button onClick={loadClimate} className="rounded-lg border border-lime-400/40 px-4 py-2 text-sm text-lime-300">
              ↻ Actualizar datos
            </button>
          </div>

          {loading && <p className="py-10 text-center text-lime-300">Consultando NASA POWER...</p>}
          {error && <div className="py-8 text-center text-amber-300">{error}</div>}

          {climate && !loading && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Temperatura media", climate.temperature.toFixed(1), "°C"],
                  ["Precipitación media", climate.rainfall.toFixed(2), "mm/día"],
                  ["Radiación solar", climate.radiation.toFixed(2), "MJ/m²/día"],
                ].map(([label, value, unit]) => (
                  <div key={label} className="rounded-xl bg-[#1b3829] p-5">
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-lime-300">{value}
                      <span className="ml-2 text-sm font-normal text-gray-400">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {[
                  { title: "Temperatura media mensual · 2025", key: "temperature" as const, unit: "°C", color: "bg-lime-400" },
                  { title: "Precipitación media diaria · 2025", key: "rainfall" as const, unit: "mm/día", color: "bg-sky-400" },
                ].map((chart) => {
                  const values = climate.months.map((m) => m[chart.key]);
                  const max = Math.max(...values, 1);
                  return (
                    <div key={chart.key}>
                      <h3 className="mb-5 font-semibold">{chart.title}</h3>
                      <div className="flex h-40 items-end gap-2 border-b border-white/10">
                        {climate.months.map((m) => (
                          <div key={m.month} className="flex h-full flex-1 flex-col justify-end">
                            <div className="mb-1 text-center text-[10px] text-gray-400">
                              {m[chart.key].toFixed(1)}
                            </div>
                            <div className={`w-full rounded-t ${chart.color}`}
                              style={{ height: `${Math.max(3, (m[chart.key] / max) * 75)}%` }} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                        {monthNames.map((m) => <span key={m}>{m}</span>)}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{chart.unit}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            NASA POWER proporciona estimaciones ambientales en cuadrícula.
            Los valores son promedios de registros mensuales disponibles;
            no son pronósticos ni mediciones directas de una parcela.
            La precipitación se expresa como promedio diario del periodo.
          </p>
        </section>

        <section className="mb-7 rounded-2xl border border-white/10 bg-[#11251b] p-6">
          <p className="text-xs font-bold text-lime-400">02 / CROP ROTATION LAB</p>
          <h2 className="mt-2 text-2xl font-bold">Diseña tus estrategias</h2>
          <p className="mt-2 text-sm text-gray-400">
            Compara una secuencia de referencia con una alternativa en tres ciclos agrícolas.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {[
              { title: "A · Estrategia de referencia", data: scenarioA, setter: setScenarioA },
              { title: "B · Estrategia alternativa", data: scenarioB, setter: setScenarioB },
            ].map((scenario) => (
              <div key={scenario.title} className="rounded-xl border border-white/10 p-5">
                <h3 className="mb-5 font-semibold text-lime-300">{scenario.title}</h3>
                {scenario.data.map((crop, index) => (
                  <label key={index} className="mb-4 block text-sm text-gray-300">
                    Ciclo agrícola {index + 1}
                    <select value={crop}
                      onChange={(e) => updateCrop(scenario.setter, scenario.data, index, e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#1c382a] p-3 text-white">
                      {crops.map((item) => <option key={item.name}>{item.name}</option>)}
                    </select>
                  </label>
                ))}
                <div className="mt-3 rounded-lg bg-[#1b3829] p-3 text-sm">
                  <p className="text-xs text-gray-400">SECUENCIA PROPUESTA</p>
                  <p className="mt-2 font-semibold">{scenario.data.join(" → ")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-[#1b3829] p-5">
            <h3 className="font-bold text-lime-300">Exploración comparativa</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400">Escenario A</p>
                <p className="mt-1 text-2xl font-bold">{uniqueA} cultivos distintos</p>
                <p className="text-xs text-gray-400">{familyCountA} familias representadas</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Escenario B</p>
                <p className="mt-1 text-2xl font-bold">{uniqueB} cultivos distintos</p>
                <p className="text-xs text-gray-400">{familyCountB} familias representadas</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-gray-300">
              La diversidad de cultivos y familias permite describir las secuencias.
              No determina por sí sola cuál es agronómicamente superior.
              Para evaluar una rotación se deben considerar suelo, calendario,
              disponibilidad de agua, variedades, plagas y conocimiento local.
            </p>
          </div>
        </section>

        <section className="mb-7 rounded-2xl border border-lime-400/20 bg-[#11251b] p-6">
          <p className="text-xs font-bold text-lime-400">03 / DECISION BRIEF</p>
          <h2 className="mt-2 text-2xl font-bold">Informe de exploración</h2>
          <p className="mt-2 text-sm text-gray-400">
            Descarga un resumen de la parcela, los datos ambientales y las estrategias comparadas.
          </p>
          <button onClick={downloadReport}
            className="mt-5 rounded-lg bg-lime-400 px-6 py-3 font-bold text-[#102016] hover:bg-lime-300">
            ↓ Descargar informe
          </button>
        </section>

        <footer className="border-t border-white/10 py-8 text-center">
          <p className="font-black tracking-[0.25em] text-lime-400">WADJE CROPSHIFT</p>
          <p className="mt-2 text-xs text-gray-500">Explore. Compare. Adapt.</p>
          <p className="mt-2 text-xs text-gray-500">
            NASA Space Apps Challenge 2026 · Global Agricultural Exploration
          </p>
          <p className="mt-2 text-xs text-gray-600">Environmental data: NASA POWER API</p>
        </footer>
      </div>
    </main>
  );
}
