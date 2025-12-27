const SUPABASE_URL = 'https://kktjuxbgudwqvbcfqfqs.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdGp1eGJndWR3cXZiY2ZxZnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYyMjAsImV4cCI6MjA3MjcyMjIyMH0.EzNPhlJOUC2VV0aTCEoi-_j-50UcNQxKNR2brh04UOo"
// var 사용: CDN에서 이미 선언된 전역 supabase와의 충돌 방지
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * 팀 이름으로 모든 통계 데이터를 조회하는 함수
 * @param {string} teamName - 조회할 팀 이름
 * @returns {Promise<Object>} 팀 정보와 모든 통계 데이터가 포함된 객체
 */
async function getTeamStats(teamName) {
    try {
        // 먼저 팀 정보를 가져와서 team_idx를 확인합니다
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('team_name', teamName)
            .single();

        if (teamError || !teamData) {
            throw new Error(`선택한 팀의 데이터를 찾을 수 없습니다: ${teamName}`);
        }

        // team_idx를 사용해서 각 통계 테이블에서 데이터를 가져옵니다
        const [baserunningResult, fieldingResult, pitchingResult, statsResult] = await Promise.all([
            supabase
                .from('kbo_team_baserunning_stats')
                .select('*')
                .eq('team_idx', teamData.idx)
                .single(),
            supabase
                .from('kbo_team_fielding_stats')
                .select('*')
                .eq('team_idx', teamData.idx)
                .single(),
            supabase
                .from('kbo_team_pitching_stats')
                .select('*')
                .eq('team_idx', teamData.idx)
                .single(),
            supabase
                .from('kbo_team_stats')
                .select('*')
                .eq('team_idx', teamData.idx)
                .single()
        ]);

        // 결과를 조합합니다
        const combinedData = {
            ...teamData,
            kbo_team_baserunning_stats: baserunningResult.data,
            kbo_team_fielding_stats: fieldingResult.data,
            kbo_team_pitching_stats: pitchingResult.data,
            kbo_team_stats: statsResult.data
        };

        // 에러가 있는지 확인합니다
        const errors = [
            baserunningResult.error,
            fieldingResult.error,
            pitchingResult.error,
            statsResult.error
        ].filter(err => err);

        if (errors.length > 0) {
            console.warn('일부 통계 데이터를 가져오지 못했습니다:', errors);
        }

        return combinedData;

    } catch (err) {
        console.error('팀 통계 조회 오류:', err);
        throw err;
    }
}

/**
 * 모든 팀 목록을 조회하는 함수
 * @returns {Promise<Array>} 팀 목록 배열
 */
async function getAllTeams() {
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('idx');

        if (error) {
            throw error;
        }

        return data;
    } catch (err) {
        console.error('팀 목록 조회 오류:', err);
        throw err;
    }
}

