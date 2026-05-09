# Read file with proper encoding
$content = [System.IO.File]::ReadAllText("c:\常駐用\HP\index.html", [System.Text.Encoding]::UTF8)
$lines = $content -split "`r`n"

# Build new section (lines 2406-2619, 0-indexed: 2405-2618)
$newSection = @'
                                    {/* 訪問エリア & 数字で見る Section - CSS Grid 2行×2列で上下端を揃える */}
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4">
                                        {/* Row1 Col1: 訪問エリア（見出し + マップ画像） */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight"><GradientText>訪問エリア</GradientText></h2>
                                            </div>
                                            <div className="rounded-t-2xl overflow-hidden flex-1">
                                                <img src="area_map.png" alt="訪問エリアマップ" className="w-full h-full object-cover block" loading="lazy" />
                                            </div>
                                        </div>

                                        {/* Row1 Col2: 数字で見る（全カード） */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight"><GradientText>数字で見る</GradientText></h2>
                                                <span className="text-xs font-bold text-slate-400">毎月月初に更新</span>
                                            </div>
                                                {/* 平均年収 */}
                                                <div className="bg-white/80 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1 bg-slate-50 rounded-lg"><Coins size={16} style={{ stroke: "url(#gold-gradient)" }} /></div>
                                                        <span className="font-bold text-[11px] md:text-xs tracking-wider text-slate-400 uppercase">社員の平均年収</span>
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-5xl md:text-6xl font-black tracking-tighter leading-none"><GradientText>{getNumericStat('平均年収', '600')}</GradientText></span>
                                                            <span className="text-lg md:text-xl font-bold text-slate-400">万円</span>
                                                        </div>
                                                        <span className="text-[10px] md:text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md mb-1">{getNumericStat('平均年収注釈', '※業界平均 350〜400万円')}</span>
                                                    </div>
                                                </div>
                                                {/* 男女比率 */}
                                                <div className="bg-white/80 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1 bg-slate-50 rounded-lg"><Users size={16} style={{ stroke: "url(#purple-gradient)" }} /></div>
                                                        <h4 className="text-sm font-bold text-slate-500">男女比率</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between text-sm font-bold text-slate-700 mb-1.5"><span>社員</span><span>男{getGenderRatio('社員').male} : 女{getGenderRatio('社員').female}</span></div>
                                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex"><div style={{ width: `${getGenderRatio('社員').male}%` }} className="bg-orange-400"></div><div style={{ width: `${getGenderRatio('社員').female}%` }} className="bg-slate-800"></div></div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-sm font-bold text-slate-700 mb-1.5"><span>登録ヘルパー</span><span>男{getGenderRatio('ヘルパー').male} : 女{getGenderRatio('ヘルパー').female}</span></div>
                                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex"><div style={{ width: `${getGenderRatio('ヘルパー').male}%` }} className="bg-orange-400"></div><div style={{ width: `${getGenderRatio('ヘルパー').female}%` }} className="bg-slate-800"></div></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* 従業員数 & 利用者数 & バイク台数 */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <StatCard icon={Users} title="従業員数" value={getNumericStat('従業員数', '127')} unit="名" subText="※うち社員35名" gradientId="purple-gradient" />
                                                    <StatCard icon={Accessibility} title="利用者数" value={getNumericStat('利用者数', '484')} unit="名" gradientId="blue-gradient" />
                                                    <StatCard icon={Bike} title="社用バイク" value={getNumericStat('バイク台数', '60')} unit="台" subText={getNumericStat('バイク内訳', '125cc 37台/電動自転車9台/他原付 17台')} gradientId="green-gradient" />
                                                </div>
                                                {/* 年齢分布 */}
                                                <div className="bg-white/80 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-slate-50 rounded-lg"><Users size={16} style={{ stroke: "url(#orange-gradient)" }} /></div>
                                                            <h4 className="text-sm font-bold text-slate-500">年齢分布</h4>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5"><div className="w-4 h-2.5 bg-orange-400 rounded-full"></div><span className="text-xs font-bold text-slate-500">社員</span></div>
                                                            <div className="flex items-center gap-1.5"><div className="w-4 h-2.5 bg-slate-700 rounded-full"></div><span className="text-xs font-bold text-slate-500">ヘルパー</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {(() => {
                                                            const ageData = getAgeDistribution();
                                                            const maxCount = Math.max(...ageData.flatMap(d => [d.employee, d.helper]), 1);
                                                            return ageData.map((item, idx) => {
                                                            const empWidth = (item.employee / maxCount) * 100;
                                                            const helperWidth = (item.helper / maxCount) * 100;
                                                            return (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-slate-500 w-8 shrink-0">{item.age}</span>
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></div>
                                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                                                        {item.employee > 0 && <div className="h-full bg-orange-400" style={{ width: `${empWidth}%` }}></div>}
                                                                        {item.helper > 0 && <div className="h-full bg-slate-700" style={{ width: `${helperWidth}%` }}></div>}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-orange-500 w-7 text-right">{item.employee || '-'}</span>
                                                                    <span className="text-xs font-bold text-slate-600 w-7 text-right">{item.helper}</span>
                                                                </div>
                                                            );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                                {/* 登録ヘルパー 給与分布 */}
                                                <div className="bg-white/80 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-slate-50 rounded-lg"><Coins size={16} style={{ stroke: "url(#gold-gradient)" }} /></div>
                                                            <h4 className="text-sm font-bold text-slate-500">登録ヘルパー 給与分布</h4>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400">単位：名</span>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {(() => {
                                                            const salaryData = getHelperSalaryDistribution();
                                                            const maxCount = Math.max(...salaryData.map(d => d.count), 1);
                                                            return salaryData.map((item, idx) => {
                                                                const width = (item.count / maxCount) * 100;
                                                                return (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold text-slate-500 w-24 shrink-0">{item.bracket}</span>
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></div>
                                                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: `${width}%` }}></div>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-orange-500 w-8 text-right">{item.count}名</span>
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                        </div>

                                        {/* Row2 Col1: スタッフに選ばれる理由 */}
                                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50 p-5 md:p-6">
                                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                                <div className="p-1.5 bg-slate-50 rounded-xl"><Users size={20} className="text-slate-600" /></div>
                                                <h3 className="text-base md:text-lg font-black text-slate-800">スタッフに選ばれる理由</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><CheckCircle size={14} className="text-orange-500" /></div>
                                                    <p className="text-sm font-bold text-slate-800">自宅から通いやすいエリアで配属</p>
                                                    <div className="ml-auto shrink-0">
                                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9v.01" /><path d="M9 12v.01" /><path d="M9 15v.01" /><path d="M9 18v.01" /></svg>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><CheckCircle size={14} className="text-orange-500" /></div>
                                                    <p className="text-sm font-bold text-slate-800">直行直帰OKで移動時間を削減</p>
                                                    <div className="ml-auto shrink-0">
                                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M5 17h14" /><path d="M6 17H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 .4-.8l3.1-2.3A1 1 0 0 1 7.1 10h4.4a1 1 0 0 1 .7.3l2.8 2.8a1 1 0 0 0 .7.3H19a2 2 0 0 1 2 2v.7a1 1 0 0 1-1 1h-1" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /></svg>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><CheckCircle size={14} className="text-orange-500" /></div>
                                                    <p className="text-sm font-bold text-slate-800">車・自転車・バイク通勤OK</p>
                                                    <div className="ml-auto shrink-0">
                                                        <Bike size={28} className="text-slate-400" style={{ strokeWidth: 1.5 }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><CheckCircle size={14} className="text-orange-500" /></div>
                                                    <p className="text-sm font-bold text-slate-800">希望休・シフト相談しやすい環境</p>
                                                    <div className="ml-auto shrink-0">
                                                        <Calendar size={28} className="text-slate-400" style={{ strokeWidth: 1.5 }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row2 Col2: 訪問エリアの希望も考慮します & 電話/面談CTA */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {/* 訪問エリアの希望も考慮します */}
                                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50 p-5 md:p-6">
                                                <div className="text-center mb-5">
                                                    <div className="inline-flex items-center gap-1 text-slate-400 text-xs font-bold">
                                                        <span>\</span>
                                                        <span className="text-base md:text-lg font-black text-slate-800">訪問エリアの希望も考慮します</span>
                                                        <span>/</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col items-center text-center gap-2">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><MapPin size={24} className="text-orange-500" /></div>
                                                        <p className="text-xs font-bold text-slate-700 leading-tight">希望エリア<br />を考慮</p>
                                                    </div>
                                                    <div className="flex flex-col items-center text-center gap-2">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><Clock size={24} className="text-orange-500" /></div>
                                                        <p className="text-xs font-bold text-slate-700 leading-tight">無理のない<br />移動距離</p>
                                                    </div>
                                                    <div className="flex flex-col items-center text-center gap-2">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><Calendar size={24} className="text-orange-500" /></div>
                                                        <p className="text-xs font-bold text-slate-700 leading-tight">シフト調整<br />しやすい</p>
                                                    </div>
                                                    <div className="flex flex-col items-center text-center gap-2">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><Heart size={24} className="text-orange-500" /></div>
                                                        <p className="text-xs font-bold text-slate-700 leading-tight">ブランク<br />復帰も安心</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* 電話相談 & 面談応募 CTA */}
                                            <div className="flex flex-col gap-3">
                                                <a href="tel:06-6746-7800" className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/50 p-5 flex items-center gap-4 group hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer">
                                                    <div className="shrink-0 w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200"><PhoneCall size={22} className="text-white" /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">迷ったらとりあえず電話！</p>
                                                        <p className="text-lg font-black text-slate-800 group-hover:text-orange-600 transition-colors">電話で相談する</p>
                                                    </div>
                                                    <ArrowRight size={20} className="text-slate-300 group-hover:text-orange-500 transition-colors shrink-0" />
                                                </a>
                                                <button onClick={() => navigateToRecruit(null)} className="flex-1 bg-slate-800 rounded-2xl shadow-lg shadow-slate-300 p-5 flex items-center gap-4 group hover:bg-slate-700 transition-all cursor-pointer text-left">
                                                    <div className="shrink-0 w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-900/30">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">まずはエリアの相談だけでもOK!</p>
                                                        <p className="text-lg font-black text-white">面談に<span className="text-orange-400">応募する</span></p>
                                                    </div>
                                                    <ArrowRight size={20} className="text-white/50 group-hover:text-white transition-colors shrink-0" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
'@

$newLines = $newSection -split "`n"

# Replace lines 2406-2619 (0-indexed: 2405-2618) with newSection
$before = $lines[0..2404]
$after = $lines[2619..($lines.Count - 1)]

$result = ($before -join "`r`n") + "`r`n" + ($newLines -join "`r`n") + "`r`n" + ($after -join "`r`n")
[System.IO.File]::WriteAllText("c:\常駐用\HP\index.html", $result, (New-Object System.Text.UTF8Encoding $true))
Write-Output "Done. New total lines: $(($result -split "`r`n").Count)"
