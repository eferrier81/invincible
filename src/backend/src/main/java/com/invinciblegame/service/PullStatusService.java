package com.invinciblegame.service;

import com.invinciblegame.domain.entity.User;
import com.invinciblegame.dto.response.PullStatusResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

@Service
public class PullStatusService {
    public PullStatusResponse buildStatus(User user) {
        boolean welcomeAvailable = !Boolean.TRUE.equals(user.getWelcomePullClaimed());
        boolean dailyAvailable = isDailyAvailable(user);
        LocalDateTime nextDaily = nextDailyAt(user, dailyAvailable);
        return new PullStatusResponse(
            welcomeAvailable,
            dailyAvailable,
            nextDaily != null ? nextDaily.toString() : null
        );
    }

    public boolean isDailyAvailable(User user) {
        if (user.getLastDailyPullAt() == null) return true;
        LocalDate last = user.getLastDailyPullAt().toLocalDate();
        return last.isBefore(LocalDate.now());
    }

    private LocalDateTime nextDailyAt(User user, boolean dailyAvailable) {
        if (dailyAvailable || user.getLastDailyPullAt() == null) {
            return null;
        }
        return user.getLastDailyPullAt().toLocalDate().plusDays(1).atStartOfDay();
    }
}
