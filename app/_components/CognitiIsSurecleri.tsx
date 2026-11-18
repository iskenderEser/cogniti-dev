"use client";

export default function CognitiIsSurecleri() {
  return (
    <section
      aria-labelledby="cogniti-is-surecleri-baslik"
      className="mx-auto w-full max-w-[1160px] px-14 pb-12 max-[800px]:px-8 max-[640px]:px-5"
    >
      <div className="border-t border-[var(--tema-hakkinda-cizgi)] pt-12 max-[800px]:pt-8">
        <p className="m-0 mb-4 text-[11px] font-medium leading-[1.5] tracking-[1.8px] text-[var(--tema-hakkinda-vurgu)]">
          COGNITI İŞ SÜREÇLERİ HARİTASI
        </p>
        <h2
          id="cogniti-is-surecleri-baslik"
          className="m-0 mb-8 font-[inherit] text-[clamp(26px,3.1vw,38px)] font-light leading-[1.25] tracking-[-1px] text-[var(--tema-hakkinda-baslik)]"
        >
          Uçtan uca tanıtım ve öğrenme
        </h2>

        <div className="w-full overflow-x-auto pb-2">
          <svg
            className="block h-auto w-full min-w-[860px]"
            viewBox="0 0 1080 475"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Cogniti iş süreçleri wireframe haritası"
          >
            <defs>
              <marker
                id="cogniti-wire-arrow"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path
                  d="M 1 1.5 L 8.5 5 L 1 8.5"
                  fill="none"
                  stroke="var(--tema-hakkinda-vurgu)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>

            {/* Üst hat başlık çizgisi */}
            <line
              x1="410"
              y1="16"
              x2="578"
              y2="16"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1"
              strokeOpacity="0.55"
            />
            <text
              x="674"
              y="20"
              textAnchor="middle"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              E-ÖĞRENME VE GELİŞİM
            </text>
            <line
              x1="770"
              y1="16"
              x2="939"
              y2="16"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1"
              strokeOpacity="0.55"
            />

            {/* İlaç Firması + 4 Araç */}
            <rect
              x="20"
              y="156"
              width="210"
              height="164"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="40"
              y="184"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              ÜRETİM
            </text>
            <text
              x="40"
              y="208"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              İlaç Firması
            </text>
            <text
              x="40"
              y="226"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
              fontWeight="400"
            >
              4 araçtan biriyle yayın üretir
            </text>

            <rect
              x="38"
              y="244"
              width="82"
              height="26"
              rx="6"
              fill="var(--tema-zemin)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeOpacity="0.45"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x="79"
              y="261"
              textAnchor="middle"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Video
            </text>

            <rect
              x="130"
              y="244"
              width="82"
              height="26"
              rx="6"
              fill="var(--tema-zemin)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeOpacity="0.45"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x="171"
              y="261"
              textAnchor="middle"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Podcast
            </text>

            <rect
              x="38"
              y="278"
              width="82"
              height="26"
              rx="6"
              fill="var(--tema-zemin)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeOpacity="0.45"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x="79"
              y="295"
              textAnchor="middle"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Dijital Broşür
            </text>

            <rect
              x="130"
              y="278"
              width="82"
              height="26"
              rx="6"
              fill="var(--tema-zemin)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeOpacity="0.45"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x="171"
              y="295"
              textAnchor="middle"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Bilimsel Belge
            </text>

            {/* Dallanma noktası */}
            <line
              x1="230"
              y1="238"
              x2="285"
              y2="238"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <circle cx="285" cy="238" r="3.5" fill="var(--tema-hakkinda-vurgu)" />

            {/* Üst hat: Saha Öğrenme (Firma -> ÜTT) */}
            <path
              d="M 285 238 C 315 238, 315 92, 355 92 L 405 92"
              fill="none"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
              markerEnd="url(#cogniti-wire-arrow)"
            />
            <text
              x="322"
              y="76"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10.5"
              fontWeight="500"
            >
              Öğrenme süreci
            </text>

            <rect
              x="410"
              y="44"
              width="185"
              height="96"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="428"
              y="70"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              SAHA ÖĞRENME
            </text>
            <text
              x="428"
              y="92"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              Temsilci (ÜTT)
            </text>
            <text
              x="428"
              y="111"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Yayınları tamamlar ve
            </text>
            <text
              x="428"
              y="126"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              önerileri uygular
            </text>

            {/* BM -> Temsilci (Geri Bildirim) */}
            <line
              x1="720"
              y1="92"
              x2="601"
              y2="92"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
              markerEnd="url(#cogniti-wire-arrow)"
            />
            <text
              x="660"
              y="76"
              textAnchor="middle"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10.5"
              fontWeight="500"
            >
              Geri Bildirim
            </text>

            <rect
              x="724"
              y="44"
              width="215"
              height="96"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="742"
              y="70"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              BÖLGE YÖNETİMİ
            </text>
            <text
              x="742"
              y="92"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              Bölge Müdürü (BM)
            </text>
            <text
              x="742"
              y="111"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              İkili çalışma sonrası
            </text>
            <text
              x="742"
              y="126"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Temsilciye yayın önerir
            </text>

            {/* Alt hat: Temsilci (ÜTT) */}
            <path
              d="M 285 238 C 315 238, 315 314, 355 314 L 405 314"
              fill="none"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
              markerEnd="url(#cogniti-wire-arrow)"
            />
            <text
              x="328"
              y="334"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10.5"
              fontWeight="500"
            >
              Özel yayınlar
            </text>

            <rect
              x="410"
              y="264"
              width="160"
              height="100"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="426"
              y="290"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              SAHA İLETİMİ
            </text>
            <text
              x="426"
              y="312"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              Temsilci (ÜTT)
            </text>
            <text
              x="426"
              y="331"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Eczanelere özel gelen
            </text>
            <text
              x="426"
              y="346"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              yayınları yönlendirir
            </text>

            {/* Temsilci çıkış dallanması */}
            <line
              x1="570"
              y1="314"
              x2="602"
              y2="314"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <circle cx="602" cy="314" r="3.5" fill="var(--tema-hakkinda-vurgu)" />

            {/* Temsilci -> Eczane Ekibi */}
            <path
              d="M 602 314 C 626 314, 626 243, 660 243 L 732 243"
              fill="none"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
              markerEnd="url(#cogniti-wire-arrow)"
            />
            <text
              x="678"
              y="227"
              textAnchor="middle"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10.5"
              fontWeight="500"
            >
              Eczaneye gönderim
            </text>

            <rect
              x="738"
              y="200"
              width="165"
              height="86"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="756"
              y="224"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              ECZANE
            </text>
            <text
              x="756"
              y="245"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              Eczane Ekibi
            </text>
            <text
              x="756"
              y="263"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Eczacı ve eczane
            </text>
            <text
              x="756"
              y="277"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              teknisyenleri
            </text>

            {/* Eczanem hattı: Temsilci -> Eczane -> Danışan */}
            <path
              d="M 602 314 C 626 314, 626 383, 660 383 L 732 383"
              fill="none"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
              markerEnd="url(#cogniti-wire-arrow)"
            />
            <text
              x="678"
              y="405"
              textAnchor="middle"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10.5"
              fontWeight="500"
            >
              Eczanem hattı
            </text>

            <rect
              x="738"
              y="340"
              width="135"
              height="86"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="754"
              y="364"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              ECZANE
            </text>
            <text
              x="754"
              y="385"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              Eczane
            </text>
            <text
              x="754"
              y="403"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Temsilciden gelen
            </text>
            <text
              x="754"
              y="417"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Eczanem yayını
            </text>

            <line
              x1="873"
              y1="383"
              x2="915"
              y2="383"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
              markerEnd="url(#cogniti-wire-arrow)"
            />

            <rect
              x="920"
              y="340"
              width="135"
              height="86"
              rx="14"
              fill="var(--tema-yuzey)"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1.35"
            />
            <text
              x="936"
              y="364"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              ECZANEM
            </text>
            <text
              x="936"
              y="385"
              fill="var(--tema-hakkinda-baslik)"
              fontSize="13.5"
              fontWeight="600"
            >
              Danışan
            </text>
            <text
              x="936"
              y="403"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              Kanıta dayalı
            </text>
            <text
              x="936"
              y="417"
              fill="var(--tema-ikincil-metin)"
              fontSize="11"
            >
              ürün bilgisi
            </text>

            {/* Alt hat başlık çizgisi */}
            <line
              x1="410"
              y1="454"
              x2="682"
              y2="454"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1"
              strokeOpacity="0.55"
            />
            <text
              x="733"
              y="458"
              textAnchor="middle"
              fill="var(--tema-hakkinda-vurgu)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.4"
            >
              E-TANITIM
            </text>
            <line
              x1="784"
              y1="454"
              x2="1055"
              y2="454"
              stroke="var(--tema-hakkinda-vurgu)"
              strokeWidth="1"
              strokeOpacity="0.55"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
