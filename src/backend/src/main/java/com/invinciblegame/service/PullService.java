package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.User;
import com.invinciblegame.dto.response.PullResultResponse;
import com.invinciblegame.dto.response.PullStatusResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PullService {
    private static final int WELCOME_COUNT = 3;
    private static final int DAILY_COUNT = 1;

    private final PackService packService;
    private final RewardService rewardService;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;

    public PullService(
        PackService packService,
        RewardService rewardService,
        CurrentUserService currentUserService,
        UserRepository userRepository
    ) {
        this.packService = packService;
        this.rewardService = rewardService;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
    }

    public PullStatusResponse status() {
        User user = currentUserService.requireCurrentUser();
        return buildStatus(user);
    }

    @Transactional
    public PullResultResponse welcomePull() {
        User user = currentUserService.requireCurrentUser();
        if (Boolean.TRUE.equals(user.getWelcomePullClaimed())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Welcome pull already claimed");
        }
        List<CharacterCard> pack = packService.generatePack(WELCOME_COUNT, false);
        for (CharacterCard card : pack) {
            rewardService.grantCard(user, card);
        }
        user.setWelcomePullClaimed(true);
        userRepository.save(user);
        return new PullResultResponse(
            "WELCOME",
            pack.stream().map(c -> rewardService.toResponse(c, true)).toList(),
            buildStatus(user)
        );
    }

    @Transactional
    public PullResultResponse dailyPull() {
        User user = currentUserService.requireCurrentUser();
        if (!isDailyAvailable(user)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Daily pull already claimed today");
        }
        List<CharacterCard> pack = packService.generatePack(DAILY_COUNT, true);
        for (CharacterCard card : pack) {
            rewardService.grantCard(user, card);
        }
        user.setLastDailyPullAt(LocalDateTime.now());
        userRepository.save(user);
        return new PullResultResponse(
            "DAILY",
            pack.stream().map(c -> rewardService.toResponse(c, true)).toList(),
            buildStatus(user)
        );
    }

    private PullStatusResponse buildStatus(User user) {
        boolean welcomeAvailable = !Boolean.TRUE.equals(user.getWelcomePullClaimed());
        boolean dailyAvailable = isDailyAvailable(user);
        LocalDateTime nextDaily = dailyAvailable || user.getLastDailyPullAt() == null
            ? null
            : user.getLastDailyPullAt().toLocalDate().plusDays(1).atStartOfDay();
        return new PullStatusResponse(
            welcomeAvailable,
            dailyAvailable,
            nextDaily != null ? nextDaily.toString() : null
        );
    }

    private boolean isDailyAvailable(User user) {
        if (user.getLastDailyPullAt() == null) return true;
        LocalDate last = user.getLastDailyPullAt().toLocalDate();
        return last.isBefore(LocalDate.now());
    }
}
