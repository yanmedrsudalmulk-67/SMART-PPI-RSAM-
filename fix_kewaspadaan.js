const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/input/index.tsx', 'utf8');

const target1 = `      let curr = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
      };
      let prev = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
      };

      if (mod.id === "kewaspadaan-isolasi") {
        curr = calculateStats(currSessions, [
          "audit_hand_hygiene",
          "audit_apd",
          "audit_ruang_isolasi",
          "audit_tps",
          "audit_ruang_tunggu",
        ]);
        prev = calculateStats(prevSessions, [
          "audit_hand_hygiene",
          "audit_apd",
          "audit_ruang_isolasi",
          "audit_tps",
          "audit_ruang_tunggu",
        ]);
      } else if (mod.id === "surveilans-hais") {`;

const repl1 = `      let curr: any = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
        standarFilled: 0,
        transmisiFilled: 0,
        monitoringFilled: 0,
      };
      let prev: any = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
        standarFilled: 0,
        transmisiFilled: 0,
        monitoringFilled: 0,
      };

      if (mod.id === "kewaspadaan-isolasi") {
        const standarIds = [
          "audit_hand_hygiene", "audit_apd", "dekontaminasi_alat", 
          "pengendalian_lingkungan", "pengelolaan_limbah_medis", 
          "pengelolaan_limbah_tajam", "penatalaksanaan_linen", 
          "perlindungan_petugas", "penempatan_pasien", 
          "etika_batuk", "penyuntikan_aman"
        ];
        const transmisiIds = [
          "monitoring_ppi_ruang_isolasi", "ppi_ruang_isolasi", 
          "monitoring_airborne", "monitoring_immuno"
        ];
        const monitoringIds = [
          "monitoring_fasilitas_hand_hygiene", "monitoring_fasilitas_apd", 
          "monitoring_ibs", "monitoring_cssd", "monitoring_laboratorium", 
          "monitoring_radiologi", "monitoring_farmasi", "monitoring_gizi", 
          "monitoring_jenazah", "monitoring_ambulance", "monitoring_tps", 
          "monitoring_tunggu"
        ];
        
        const calcIso = (data: any[]) => {
            const standarSet = new Set(data.filter(d => standarIds.some(id => d.indikator_id?.includes(id))).map(d => standarIds.find(id => d.indikator_id?.includes(id))));
            const transmisiSet = new Set(data.filter(d => transmisiIds.some(id => d.indikator_id?.includes(id))).map(d => transmisiIds.find(id => d.indikator_id?.includes(id))));
            const monitoringSet = new Set(data.filter(d => monitoringIds.some(id => d.indikator_id?.includes(id))).map(d => monitoringIds.find(id => d.indikator_id?.includes(id))));
            
            const standarSize = Math.min(standarSet.size, 10);
            const totalFilled = standarSize + transmisiSet.size + monitoringSet.size;
            const totalExpected = 10 + 4 + 12; // 26
            
            return {
                records: data.length,
                totalDinilai: totalExpected,
                totalPatuh: totalFilled,
                persentase: (totalFilled / totalExpected) * 100,
                avgPersentase: 0,
                standarFilled: standarSize,
                transmisiFilled: transmisiSet.size,
                monitoringFilled: monitoringSet.size,
            };
        };

        curr = calcIso(currSessions);
        prev = calcIso(prevSessions);
      } else if (mod.id === "surveilans-hais") {`;

const target2 = `      let finalPersentase = curr.persentase;
      let finalPrevPersentase = prev.persentase;
      let diff = 0;
      let valLabel = "PATUH";
      let statCountLabel = "Total Audit";
      let statCountVal = curr.totalDinilai.toString();
      let statPatuhLabel = "Patuh";
      let statPatuhVal = curr.totalPatuh.toString();

      if (mod.id === "surveilans-hais") {`;

const repl2 = `      let finalPersentase = curr.persentase;
      let finalPrevPersentase = prev.persentase;
      let diff = 0;
      let valLabel = "PATUH";
      let statCountLabel = "Total Audit";
      let statCountVal = curr.totalDinilai.toString();
      let statPatuhLabel = "Patuh";
      let statPatuhVal = curr.totalPatuh.toString();
      let isTerpenuhi = false;

      if (mod.id === "kewaspadaan-isolasi") {
        valLabel = "TERPENUHI";
        isTerpenuhi = curr.totalPatuh >= curr.totalDinilai;
      } else if (mod.id === "surveilans-hais") {`;

const target3 = `      let mainCount = curr.totalDinilai.toString();
      if (mod.id === "surveilans-hais")
        mainCount = (curr.totalDinilai - curr.totalPatuh).toString();
      if (mod.id === "diklat") mainCount = curr.records.toString();

      return {
        ...mod,
        passStandard,
        computed: {
          mainCount,
          mainLabel: \`\${finalPersentase.toFixed(1)}% \${valLabel}\`,
          trendUp: isTrendUp,
          // Up is good except for HAIs
          trendColor:
            mod.id === "surveilans-hais"
              ? isTrendUp
                ? "text-red-500"
                : "text-emerald-500"
              : isTrendUp
                ? "text-emerald-500"
                : "text-red-500",
          trendText,
          progress: Math.min(Math.max(finalPersentase, 0), 100),
          progressColor,
          subStats: [
            {
              label: statCountLabel,
              value: statCountVal,
              icon: mod.icon,
              iconColor: mod.colorTheme.colIconBox,
            },
            {
              label: statPatuhLabel,
              value: statPatuhVal,
              icon: CheckCircle2,
              iconColor: passStandard 
                ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                : "bg-red-500/5 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400",
            },
            {
              label: "Trend",
              value: \`\${diff > 0 ? "+" : ""}\${diff.toFixed(1)}%\`,
              icon: isTrendUp ? TrendingUp : TrendingDown,
              iconColor: mod.colorTheme.colIconBox,
            },
          ],
        },
      };
    });
  }, [`;

const repl3 = `      let mainCount = curr.totalDinilai.toString();
      if (mod.id === "kewaspadaan-isolasi")
        mainCount = curr.totalPatuh.toString();
      if (mod.id === "surveilans-hais")
        mainCount = (curr.totalDinilai - curr.totalPatuh).toString();
      if (mod.id === "diklat") mainCount = curr.records.toString();

      let subStatsArray = [
        {
          label: statCountLabel,
          value: statCountVal,
          icon: mod.icon,
          iconColor: mod.colorTheme.colIconBox,
        },
        {
          label: statPatuhLabel,
          value: statPatuhVal,
          icon: CheckCircle2,
          iconColor: passStandard 
            ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
            : "bg-red-500/5 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400",
        },
        {
          label: "Trend",
          value: \`\${diff > 0 ? "+" : ""}\${diff.toFixed(1)}%\`,
          icon: isTrendUp ? TrendingUp : TrendingDown,
          iconColor: mod.colorTheme.colIconBox,
        },
      ];

      if (mod.id === "kewaspadaan-isolasi") {
        subStatsArray = [
          {
            label: "Standar",
            value: \`\${curr.standarFilled}/10\`,
            icon: ShieldCheck,
            iconColor: mod.colorTheme.colIconBox,
          },
          {
            label: "Transmisi",
            value: \`\${curr.transmisiFilled}/4\`,
            icon: ShieldAlert,
            iconColor: mod.colorTheme.colIconBox,
          },
          {
            label: "Monitoring",
            value: \`\${curr.monitoringFilled}/12\`,
            icon: Activity,
            iconColor: mod.colorTheme.colIconBox,
          },
        ];
      }

      return {
        ...mod,
        passStandard: mod.id === "kewaspadaan-isolasi" ? isTerpenuhi : passStandard,
        computed: {
          mainCount,
          mainLabel: \`\${finalPersentase.toFixed(1)}% \${valLabel}\`,
          trendUp: isTrendUp,
          trendColor:
            mod.id === "surveilans-hais"
              ? isTrendUp
                ? "text-red-500"
                : "text-emerald-500"
              : isTrendUp
                ? "text-emerald-500"
                : "text-red-500",
          trendText,
          progress: Math.min(Math.max(finalPersentase, 0), 100),
          progressColor,
          subStats: subStatsArray,
        },
      };
    });
  }, [`;

code = code.replace(target1, repl1);
code = code.replace(target2, repl2);
code = code.replace(target3, repl3);

if (!code.includes("ShieldCheck") && !code.includes("import { ShieldCheck")) {
    code = code.replace("ClipboardCheck,", "ClipboardCheck, ShieldCheck, ShieldAlert,");
}

fs.writeFileSync('src/pages/dashboard/input/index.tsx', code);
console.log('Patched');
